"""Evaluate fixed CLIP prompts on a deterministic grouped held-out sample."""

import argparse
from collections import Counter, defaultdict, deque
from contextlib import closing
import hashlib
import json
from pathlib import Path
import platform
from statistics import median, quantiles
from time import perf_counter
from zipfile import ZipFile

from backend.assets import ARCHIVE, DATASET_DIR, LABELS, MODEL_ID, MODEL_REVISION, WEIGHTS_SHA256, sha256_file
from backend.clip_model import METHODS, PROMPTS, ClipClassifier
from backend.dataset import AUDIT, MANIFEST, stable_rank
from backend.images import decode_image

SAMPLE_SEED = "medilens-held-out-sample-v1"


def choose_sample(rows: list[dict], per_class: int | None) -> list[dict]:
    held_out = [row for row in rows if row["split"] == "held-out"]
    if per_class is None:
        return held_out

    selected = []
    for label in LABELS:
        groups = defaultdict(deque)
        for row in sorted(held_out, key=lambda row: stable_rank(SAMPLE_SEED, row["member"])):
            if row["label"] == label:
                groups[row["group"]].append(row)
        if sum(map(len, groups.values())) < per_class:
            raise ValueError(f"Held-out partition has fewer than {per_class} {label} images.")
        group_order = deque(sorted(groups, key=lambda group: stable_rank(SAMPLE_SEED, group)))
        for _ in range(per_class):
            group = group_order.popleft()
            selected.append(groups[group].popleft())
            if groups[group]:
                group_order.append(group)
    return selected


def summarize(expected: list[str], predicted: list[str]) -> dict:
    counts = Counter(zip(expected, predicted, strict=True))
    matrix = [[counts[actual, prediction] for prediction in LABELS] for actual in LABELS]
    tp, fp, fn = matrix[0][0], matrix[1][0], matrix[0][1]
    precision = tp / (tp + fp) if tp + fp else None
    recall = tp / (tp + fn) if tp + fn else None
    return {
        "accuracy": (tp + matrix[1][1]) / len(expected),
        "precision_parasitized": precision,
        "recall_parasitized": recall,
        "f1_parasitized": 2 * tp / (2 * tp + fp + fn) if 2 * tp + fp + fn else None,
        "confusion_matrix": {"order": LABELS, "rows_actual_columns_predicted": matrix},
    }


def run(per_class: int | None, output: Path) -> dict:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sha256_file(MANIFEST) != audit["manifest_sha256"]:
        raise ValueError("Manifest SHA-256 does not match the audit.")
    rows = [json.loads(line) for line in MANIFEST.read_text(encoding="utf-8").splitlines()]
    sample = choose_sample(rows, per_class)
    if {row["label"] for row in sample} != set(LABELS):
        raise ValueError("Evaluation requires both classes in the held-out set.")
    if sha256_file(DATASET_DIR / ARCHIVE) != audit["inputs_sha256"][ARCHIVE]:
        raise ValueError("Archive SHA-256 does not match the audited manifest.")

    classifier = ClipClassifier()
    import transformers

    records = []
    with ZipFile(DATASET_DIR / ARCHIVE) as archive:
        # Warm up on a development image and exclude its result and latency.
        warmup = next(row for row in rows if row["split"] == "development")
        with closing(decode_image(archive.read(warmup["member"]), "image/png")) as image:
            classifier.predict([image])

        for index, row in enumerate(sample, start=1):
            contents = archive.read(row["member"])
            if hashlib.sha256(contents).hexdigest() != row["sha256"]:
                raise ValueError("A sample image no longer matches the manifest.")
            start = perf_counter()
            with closing(decode_image(contents, "image/png")) as image:
                scores = classifier.predict([image])
            elapsed = (perf_counter() - start) * 1000
            records.append({
                "member": row["member"], "image_sha256": row["sha256"],
                "group": row["group"], "actual": row["label"], "latency_ms": elapsed,
                "predictions": {method: {"label": items[0].label, "scores": items[0].scores} for method, items in scores.items()},
            })
            if index % 32 == 0:
                print(f"Evaluated {index}/{len(sample)} images", flush=True)

    expected = [record["actual"] for record in records]
    timings = [record["latency_ms"] for record in records]
    examples = []
    for label in LABELS:
        record = next(item for item in records if item["actual"] == label)
        examples.append({key: record[key] for key in ("image_sha256", "actual", "predictions")})
    report = {
        "scope": "deterministic class-balanced patient-grouped held-out subset" if per_class else "full patient-grouped held-out partition",
        "sample_seed": SAMPLE_SEED, "requested_per_class": per_class,
        "images_evaluated": len(records), "class_counts": dict(Counter(expected)),
        "groups_evaluated": len({item["group"] for item in records}), "dataset_audit": audit,
        "model": {"id": MODEL_ID, "revision": MODEL_REVISION, "weights_sha256": WEIGHTS_SHA256},
        "hardware": {
            "cpu": platform.processor(), "device": str(classifier.device), "cpu_threads": classifier.torch.get_num_threads(),
            "python": platform.python_version(), "torch": classifier.torch.__version__, "transformers": transformers.__version__,
        },
        "prompts": PROMPTS,
        "methods": {method: summarize(expected, [record["predictions"][method]["label"] for record in records]) for method in METHODS},
        "paired_latency_ms": {
            "scope": "single-image decode, preprocessing, shared image encoder and both score vectors; excludes model load, warmup, archive I/O, and HTTP",
            "mean": sum(timings) / len(timings), "median": median(timings),
            "p95": quantiles(timings, n=100, method="inclusive")[94],
        },
        "examples": examples,
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    details = DATASET_DIR / "evaluation-predictions.jsonl"
    with details.open("w", encoding="utf-8", newline="\n") as stream:
        for record in records:
            stream.write(json.dumps(record, allow_nan=False) + "\n")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    limits = parser.add_mutually_exclusive_group()
    limits.add_argument("--per-class", type=int, default=128)
    limits.add_argument("--full", action="store_true")
    parser.add_argument("--output", type=Path, default=DATASET_DIR / "evaluation.json")
    args = parser.parse_args()
    if not args.full and args.per_class < 1:
        parser.error("--per-class must be positive.")
    report = run(None if args.full else args.per_class, args.output)
    print(json.dumps({key: report[key] for key in ("images_evaluated", "methods", "paired_latency_ms", "examples")}, indent=2))


if __name__ == "__main__":
    main()
