"""Prepare, select on validation, and score one locked paired test benchmark."""

import argparse
from collections import Counter
from contextlib import ExitStack
import hashlib
from importlib.metadata import version
import json
from pathlib import Path
import platform
from statistics import mean, median, quantiles
import subprocess
import sys
from time import perf_counter
from zipfile import ZipFile

from backend.assets import ARCHIVE, DATASET_DIR, LABELS, WEIGHTS_SHA256, download, sha256_file
from backend.clip_model import PROMPTS
from backend.evaluate import summarize as step2_metrics
from backend.images import decode_image
from backend.step3_biomed import BIO_DIR, BIO_FILES, BIO_ID, BIO_REV, BIO_SHA, BIO_WEIGHT, TEXT_ID
from backend.step3_models import MODEL_DETAILS, build_text_bank, fit_head, head_tensors, load_encoder, prediction, score_matrix
from backend.step3_protocol import METHODS, PROTOCOL, RUN, SELECTION, partition, prepare, read_json, read_rows, write_json

BERT_REV = "d673b8835373c6fa116d6d8006b33d48734e305d"
ROOT = Path(__file__).resolve().parents[1]


def assets():
    for file, size in BIO_FILES.items():
        download(f"https://huggingface.co/{BIO_ID}/resolve/{BIO_REV}/{file}", BIO_DIR / file, size,
                 BIO_SHA if file == BIO_WEIGHT else None)
    download(f"https://huggingface.co/{TEXT_ID}/resolve/{BERT_REV}/config.json", BIO_DIR / "config.json", 385)


def metrics(actual, predicted):
    counts = Counter(zip(actual, predicted, strict=True))
    matrix = [[counts[a, b] for b in LABELS] for a in LABELS]
    by_class = {}
    for i, label in enumerate(LABELS):
        tp, fp, fn = matrix[i][i], matrix[1 - i][i], matrix[i][1 - i]
        by_class[label] = {
            "precision": tp / (tp + fp) if tp + fp else 0.0,
            "recall": tp / (tp + fn),
            "f1": 2 * tp / (2 * tp + fp + fn),
        }
    return {
        "n": len(actual), "accuracy": sum(matrix[i][i] for i in range(2)) / len(actual),
        "balanced_accuracy": mean(row["recall"] for row in by_class.values()),
        "macro_f1": mean(row["f1"] for row in by_class.values()), "per_class": by_class,
        "confusion_matrix": matrix, "prediction_counts": {label: predicted.count(label) for label in LABELS},
    }


def historical_audit():
    reported = read_json(ROOT / "research/step-2-results.json")
    rows = read_rows(DATASET_DIR / "evaluation-predictions.jsonl")
    from backend.dataset import MANIFEST
    from backend.evaluate import choose_sample
    expected = choose_sample(read_rows(MANIFEST), 128)
    if [row["image_sha256"] for row in rows] != [row["sha256"] for row in expected]:
        raise ValueError("Step 2 historical sample does not match the frozen membership.")
    audit = {}
    for method in ("class-name", "knowledge-guided"):
        scores = [row["predictions"][method] for row in rows]
        computed = [prediction([record["scores"][label] for label in LABELS]).label for record in scores]
        recorded = [record["label"] for record in scores]
        stats = step2_metrics([row["actual"] for row in rows], computed)
        stats = json.loads(json.dumps(stats))
        if computed != recorded or stats != reported["methods"][method]:
            raise ValueError("Historical labels or metrics are inconsistent.")
        margins = [record["scores"][LABELS[0]] - record["scores"][LABELS[1]] for record in scores]
        audit[method] = {"confirmed": True, "parasite_minus_uninfected": {"min": min(margins), "median": median(margins),
                         "max": max(margins)}, "parasitized_predictions": computed.count(LABELS[0])}
    return audit


def forward_audit(encoder, image):
    torch = encoder.torch
    text = [prompt for method in ("class-name", "knowledge-guided") for prompt in PROMPTS[method]]
    tokens = encoder.tokenizer(text, padding=True, return_tensors="pt").to(encoder.device)
    pixels = encoder.image_processor(images=[image], return_tensors="pt").pixel_values.to(encoder.device)
    with torch.inference_mode():
        model_output = encoder.model(pixel_values=pixels, **tokens)
        logits = model_output.logits_per_image / encoder.model.logit_scale.exp()
        manual = encoder.image_features([image]) @ encoder.text_embeddings(text).T
    delta = (logits - manual).abs().max().item()
    if delta > 1e-5:
        raise ValueError("Manual cosine vectors disagree with native CLIP logits.")
    return delta


def encode(encoder, archive, rows):
    outputs = []
    for start in range(0, len(rows), 8):
        with ExitStack() as stack:
            images = []
            for row in rows[start:start + 8]:
                contents = archive.read(row["member"])
                if hashlib.sha256(contents).hexdigest() != row["sha256"]:
                    raise ValueError("Sample bytes do not match the frozen manifest.")
                images.append(stack.enter_context(decode_image(contents, "image/png")))
            outputs.append(encoder.image_features(images))
        if (start + 8) % 128 == 0:
            print(f"Encoded {start + 8}/{len(rows)} crops", flush=True)
    return encoder.torch.cat(outputs)


def score_rows(rows, outputs, methods, bank, head):
    actual = [row["label"] for row in rows]
    scores = {}
    for method in methods:
        results = [prediction(pair) for pair in score_matrix(outputs, method, bank, head).cpu().tolist()]
        predictions = [record.label for record in results]
        report = metrics(actual, predictions)
        failures = {}
        for label in LABELS:
            errors = []
            for row, record in zip(rows, results, strict=True):
                if row["label"] == label and label != record.label:
                    errors.append({"image_sha256": row["sha256"], "actual": label,
                                   "predicted": record.label, "scores": record.scores})
            failures[label] = errors[:2]
        (RUN / f"{rows[0]['experiment_partition']}-{method}-predictions.jsonl").write_text(
            "".join(json.dumps({"image_sha256": row["sha256"], "actual": row["label"],
                                "predicted": record.label, "scores": record.scores}) + "\n"
                    for row, record in zip(rows, results, strict=True)),
            encoding="utf-8", newline="\n",
        )
        scores[method] = {**report, "failure_examples": failures}
    return scores


def worker(stage, family):
    import psutil

    protocol = read_json(PROTOCOL)
    process = psutil.Process()
    rss_before = process.memory_info().rss
    start = perf_counter()
    encoder = load_encoder(family)
    bank = build_text_bank(encoder, family)
    startup = perf_counter() - start
    head_path = RUN / f"{family}-head.json"

    with ZipFile(DATASET_DIR / ARCHIVE) as archive:
        if stage == "fit":
            dev = partition("development", protocol)
            val = partition("validation", protocol)
            first = archive.read(dev[0]["member"])
            with decode_image(first, "image/png") as image:
                encoder.image_features([image])
                delta = forward_audit(encoder, image) if family == "clip" else None
            info = process.memory_info()
            training = encode(encoder, archive, dev)
            write_json(head_path, fit_head(training, [row["label"] for row in dev], encoder))
            head = head_tensors(read_json(head_path), encoder)
            validation = encode(encoder, archive, val)
            rows = [{**row, "experiment_partition": "validation"} for row in val]
            reports = score_rows(rows, validation, METHODS[family], bank, head)

            timing_data = [archive.read(row["member"]) for row in [*val[:12], *val[-12:]]]
            runtime = {}
            for method in METHODS[family]:
                timings = []
                for contents in timing_data:
                    tick = perf_counter()
                    with decode_image(contents, "image/png") as image:
                        features = encoder.image_features([image])
                    prediction(score_matrix(features, method, bank, head)[0].cpu().tolist())
                    timings.append((perf_counter() - tick) * 1000)
                runtime[method] = {"median_ms": median(timings), "p95_ms": quantiles(timings, n=100, method="inclusive")[94]}
            peak = process.memory_info()
            model_id, revision = MODEL_DETAILS[family]
            weight_count = sum(parameter.numel() for parameter in encoder.model.parameters())
            result = {
                "checkpoint": {"id": model_id, "revision": revision, "sha256": WEIGHTS_SHA256 if family == "clip" else BIO_SHA},
                "runtime": {"initialization_s": startup, "rss_before_mib": rss_before / 2**20,
                            "warmed_rss_mib": info.rss / 2**20, "process_peak_working_set_mib": getattr(peak, "peak_wset", peak.rss) / 2**20,
                            "encoder_parameters": weight_count, "head_parameters": 2 * (training.shape[1] + 1),
                            "device": str(encoder.device), "torch": encoder.torch.__version__, "latency": runtime},
                "validation": reports,
                "protocol_sha256": sha256_file(PROTOCOL), "head_sha256": sha256_file(head_path),
                "native_clip_cosine_max_abs_delta": delta,
            }
            write_json(RUN / f"{family}-validation.json", result)
        else:
            selection = read_json(SELECTION)
            marker = RUN / "test-opened"
            if marker.read_text(encoding="utf-8").strip() != selection["protocol_sha256"]:
                raise ValueError("Test access requires the matching validation lock.")
            if (RUN / f"{family}-test.json").exists():
                raise ValueError("This backbone has already scored the locked test.")
            if sha256_file(head_path) != selection["head_sha256"][family]:
                raise ValueError("Trained head changed after validation selection.")
            rows = [{**row, "experiment_partition": "test"} for row in partition("test", protocol)]
            head = head_tensors(read_json(head_path), encoder)
            results = score_rows(rows, encode(encoder, archive, rows), METHODS[family], bank, head)
            write_json(RUN / f"{family}-test.json", results)


def launch(stage, family):
    subprocess.run([sys.executable, "-m", "backend.step3", "worker", stage, family], check=True)


def validation():
    if SELECTION.exists():
        raise ValueError("A validation selection is already frozen for this protocol.")
    protocol = prepare()
    for family in METHODS:
        cached = RUN / f"{family}-validation.json"
        head = RUN / f"{family}-head.json"
        if not cached.exists() or not head.exists() or (
            read_json(cached).get("protocol_sha256") != sha256_file(PROTOCOL)
            or read_json(cached).get("head_sha256") != sha256_file(head)
        ):
            launch("fit", family)
    runs = {family: read_json(RUN / f"{family}-validation.json") for family in METHODS}
    rankings = []
    for family, run in runs.items():
        for method, summary in run["validation"].items():
            floor = min(row["recall"] for row in summary["per_class"].values())
            rank = (floor, summary["balanced_accuracy"], summary["macro_f1"], -run["runtime"]["latency"][method]["median_ms"])
            rankings.append((rank, family, method))
    rank, family, method = max(rankings)
    selection = {
        "selected": method, "family": family, "rank": rank, "protocol_sha256": sha256_file(PROTOCOL),
        "head_sha256": {family: sha256_file(RUN / f"{family}-head.json") for family in METHODS},
        "validation_sha256": {family: sha256_file(RUN / f"{family}-validation.json") for family in METHODS},
    }
    write_json(SELECTION, selection)
    print(json.dumps({"selection": selection, "protocol": protocol}, indent=2), flush=True)


def final():
    output = RUN / "final-report.json"
    if output.exists():
        raise ValueError("The locked final test has already been reported.")
    selection = read_json(SELECTION)
    if sha256_file(PROTOCOL) != selection["protocol_sha256"]:
        raise ValueError("Protocol changed after selection.")
    for family in METHODS:
        if sha256_file(RUN / f"{family}-validation.json") != selection["validation_sha256"][family]:
            raise ValueError("Validation metrics changed after selection.")
    audit = historical_audit()
    lock = RUN / "test-opened"
    with lock.open("x", encoding="utf-8") as handle:
        handle.write(selection["protocol_sha256"] + "\n")
    for family in METHODS:
        launch("final", family)
    report = {
        "historical_audit": audit, "protocol": read_json(PROTOCOL), "selection": selection,
        "execution": {
            "python": platform.python_version(), "platform": platform.system(), "cpu_threads": 4,
            "packages": {name: version(name) for name in ("torch", "torchvision", "transformers", "open-clip-torch", "timm", "psutil")},
        },
        "labels": LABELS, "validation": {key: read_json(RUN / f"{key}-validation.json") for key in METHODS},
        "final_test": {key: read_json(RUN / f"{key}-test.json") for key in METHODS},
    }
    write_json(output, report)
    print(f"Final test saved to {output.relative_to(ROOT)}.", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["assets", "prepare", "audit", "validation", "final", "worker"])
    parser.add_argument("stage", choices=["fit", "final"], nargs="?")
    parser.add_argument("family", choices=METHODS, nargs="?")
    args = parser.parse_args()
    if args.command == "worker":
        if args.stage is None or args.family is None:
            parser.error("worker requires a stage and model family.")
        worker(args.stage, args.family)
    elif args.command == "assets":
        assets()
    elif args.command == "prepare":
        print(json.dumps(prepare(), indent=2))
    elif args.command == "audit":
        print(json.dumps(historical_audit(), indent=2))
    elif args.command == "validation":
        validation()
    else:
        final()


if __name__ == "__main__":
    main()
