"""Freeze the Step 3 group partitions and exact evaluation members."""

from collections import Counter, defaultdict, deque
from itertools import combinations
import json
from pathlib import Path

from backend.assets import ARCHIVE, CACHE, DATASET_DIR, LABELS, sha256_file
from backend.dataset import AUDIT, MANIFEST, stable_rank

RUN = CACHE / "step3"
PROTOCOL = RUN / "protocol.json"
SELECTION = RUN / "selection.json"
SEED = "medilens-step3-split-v1"
PARTITIONS = {"development": 384, "validation": 128, "test": 192}
METHODS = {
    "clip": ("class-name", "knowledge-guided", "clip-ensemble", "clip-ridge"),
    "biomed": ("biomed-class-name", "biomed-ensemble", "biomed-ridge"),
}
RIDGE = 0.001
PROMPT_VERSION = "cell-morphology-v1"
ENSEMBLE = (
    (
        "A Giemsa-stained thin blood smear showing a parasitized red blood cell.",
        "A thin blood smear crop of a red cell with a small delicate intracellular parasite ring.",
        "A stained red blood cell containing a malaria parasite with visible chromatin.",
    ),
    (
        "A Giemsa-stained thin blood smear showing an uninfected red blood cell.",
        "A thin blood smear crop of a red cell with no visible intracellular parasite.",
        "A stained red blood cell with pale cytoplasm and no visible parasite structures.",
    ),
)


def write_json(path: Path, value) -> None:
    temp = path.with_suffix(path.suffix + ".part")
    temp.write_text(json.dumps(value, indent=2, allow_nan=False) + "\n", encoding="utf-8", newline="\n")
    temp.replace(path)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_rows(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]


def choose_members(rows: list[dict], partition: str, count: int) -> list[dict]:
    order_seed = f"{SEED}-{partition}"
    selected = []
    for label in LABELS:
        groups = defaultdict(deque)
        for row in sorted(rows, key=lambda item: stable_rank(order_seed, item["sha256"])):
            if row["label"] == label:
                groups[row["group"]].append(row)
        if sum(map(len, groups.values())) < count:
            raise ValueError(f"Insufficient {label} crops for {partition}.")
        order = deque(sorted(groups, key=lambda group: stable_rank(order_seed, group)))
        for _ in range(count):
            group = order.popleft()
            selected.append(groups[group].popleft())
            if groups[group]:
                order.append(group)
    return selected


def assert_disjoint(partitions: dict[str, list[dict]]) -> None:
    for left, right in combinations(partitions, 2):
        for key in ("group", "source_image", "sha256"):
            a = {row[key] for row in partitions[left]} - {None}
            b = {row[key] for row in partitions[right]} - {None}
            if a & b:
                raise ValueError(f"{key} overlap between {left} and {right}.")


def prepare() -> dict:
    audit = read_json(AUDIT)
    manifest_hash = sha256_file(MANIFEST)
    if manifest_hash != audit["manifest_sha256"] or sha256_file(DATASET_DIR / ARCHIVE) != audit["inputs_sha256"][ARCHIVE]:
        raise ValueError("The archive or its verified Step 2 manifest has changed.")
    rows = read_rows(MANIFEST)
    development = [row for row in rows if row["split"] == "development"]
    # Prior warmup, API tests, and browser smoke used the first development crop for each label.
    used_groups = {next(row["group"] for row in development if row["label"] == label) for label in LABELS}
    quarantine = [row for row in rows if row["split"] == "held-out" or row["group"] in used_groups]
    eligible = [row for row in development if row["group"] not in used_groups]
    groups = sorted({row["group"] for row in eligible}, key=lambda group: stable_rank(SEED, group))
    fifth = len(groups) // 5
    assignments = {
        group: "test" if index < fifth else "validation" if index < 2 * fifth else "development"
        for index, group in enumerate(groups)
    }
    populations = {name: [row for row in eligible if assignments[row["group"]] == name] for name in PARTITIONS}
    assert_disjoint({**populations, "previously exposed": quarantine})

    RUN.mkdir(parents=True, exist_ok=True)
    stats = {}
    for name, cap in PARTITIONS.items():
        population = populations[name]
        sample = choose_members(population, name, cap)
        path = RUN / f"{name}.jsonl"
        contents = "".join(json.dumps(row, sort_keys=True) + "\n" for row in sample)
        if path.exists() and path.read_bytes() != contents.encode():
            raise ValueError(f"Previously frozen {name} membership differs.")
        path.write_text(contents, encoding="utf-8", newline="\n")
        stats[name] = {
            "population_class_counts": dict(Counter(row["label"] for row in population)),
            "population_groups": len({row["group"] for row in population}),
            "sample_class_counts": dict(Counter(row["label"] for row in sample)),
            "sample_groups": len({row["group"] for row in sample}),
            "sample_sha256": sha256_file(path),
        }
    protocol = {
        "seed": SEED, "source_manifest_sha256": manifest_hash, "inputs_sha256": audit["inputs_sha256"],
        "quarantined_groups": len({row["group"] for row in quarantine}), "quarantined_crops": len(quarantine),
        "partitions": stats, "methods": {key: list(names) for key, names in METHODS.items()},
        "prompt_version": PROMPT_VERSION, "prompts": [list(group) for group in ENSEMBLE], "ridge_penalty": RIDGE,
        "selection_rule": ["minimum class recall", "balanced accuracy", "macro F1", "lower median single-image latency"],
    }
    if PROTOCOL.exists() and read_json(PROTOCOL) != protocol:
        raise ValueError("Existing experiment protocol differs.")
    write_json(PROTOCOL, protocol)
    return protocol


def partition(name: str, protocol: dict) -> list[dict]:
    path = RUN / f"{name}.jsonl"
    if sha256_file(path) != protocol["partitions"][name]["sample_sha256"]:
        raise ValueError(f"{name} membership has changed.")
    return read_rows(path)
