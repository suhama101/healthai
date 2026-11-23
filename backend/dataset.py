"""Audit the official NLM archive and build a deterministic grouped manifest."""

import ast
from collections import Counter, defaultdict
import hashlib
from io import BytesIO
import json
from pathlib import Path, PurePosixPath
import re
from zipfile import ZipFile

from PIL import Image

from backend.assets import ARCHIVE, DATASET_DIR, DATASET_FILES, LABELS, MAPPINGS, sha256_file

MANIFEST = DATASET_DIR / "manifest.jsonl"
AUDIT = DATASET_DIR / "audit.json"
SPLIT_SEED = "medilens-nlm-split-v1"


def stable_rank(seed: str, value: str) -> str:
    return hashlib.sha256(f"{seed}:{value}".encode()).hexdigest()


def load_patient_mapping(path: Path) -> dict[str, str]:
    mappings = {}
    for row in path.read_text(encoding="utf-8-sig").splitlines():
        if not row.strip():
            continue
        patient, _, payload = row.partition(",")
        files, bracket, padding = payload.partition("]")
        if not bracket or padding.strip(", \r\t") or not patient:
            raise ValueError(f"Unexpected official mapping format in {path.name}")
        for name in ast.literal_eval(files + bracket):
            name = name.casefold()
            patient_id = patient.casefold()
            if mappings.setdefault(name, patient_id) != patient_id:
                raise ValueError(f"Conflicting patient mapping in {path.name}")
    return mappings


def canonical_groups(identifiers: set[str]) -> dict[str, str]:
    """Conservatively merge mapping rows that share a leading C or a P number."""
    parent = {name: name for name in identifiers}
    keys = {}

    def root(name: str) -> str:
        while parent[name] != name:
            name = parent[name]
        return name

    for name in sorted(identifiers):
        for key in re.findall(r"^c[0-9]+|p[0-9]+", name):
            previous = keys.setdefault(key, name)
            roots = sorted((root(previous), root(name)))
            parent[roots[1]] = roots[0]
    return {name: root(name) for name in identifiers}


def build_manifest() -> tuple[list[dict], dict]:
    patients = {label: load_patient_mapping(DATASET_DIR / MAPPINGS[label]) for label in LABELS}
    groups = canonical_groups(set().union(*(set(mapping.values()) for mapping in patients.values())))
    rows = []
    with ZipFile(DATASET_DIR / ARCHIVE) as archive:
        for item in sorted(archive.infolist(), key=lambda info: info.filename):
            path = PurePosixPath(item.filename)
            label = path.parent.name.lower()
            if label not in LABELS or path.suffix.lower() != ".png":
                continue
            contents = archive.read(item)
            with Image.open(BytesIO(contents), formats=["PNG"]) as image:
                image.verify()
            patient = patients[label].get(path.name.casefold())
            source, marker, index = path.stem.rpartition("_cell_")
            if not marker or not index.isdecimal():
                source = None
            rows.append({
                "member": item.filename, "label": label, "format": "PNG",
                "mapping_id": patient, "group": groups.get(patient), "source_image": source,
                "sha256": hashlib.sha256(contents).hexdigest(),
            })
    if len({row["member"] for row in rows}) != len(rows) or not rows:
        raise ValueError("Image members must be present and unique.")

    digests = Counter(row["sha256"] for row in rows)
    labels_by_digest = defaultdict(set)
    for row in rows:
        labels_by_digest[row["sha256"]].add(row["label"])
        if row["group"] is None:
            row["split"] = "excluded-unmapped"
        elif digests[row["sha256"]] > 1:
            row["split"] = "excluded-byte-duplicate"
        else:
            # A fixed hash threshold puts every cell from the same group into the same partition.
            bucket = int(stable_rank(SPLIT_SEED, row["group"])[:8], 16)
            row["split"] = "held-out" if bucket < (2**32 // 5) else "development"

    split_summary = {}
    for split in sorted({row["split"] for row in rows}):
        partition = [row for row in rows if row["split"] == split]
        split_summary[split] = {
            "class_counts": dict(Counter(row["label"] for row in partition)),
            "groups": len({row["group"] for row in partition if row["group"] is not None}),
        }
    audit = {
        "inputs_sha256": {name: sha256_file(DATASET_DIR / name) for name in DATASET_FILES},
        "class_counts": dict(Counter(row["label"] for row in rows)),
        "formats": dict(Counter(row["format"] for row in rows)),
        "published_mapping_rows": {label: len(set(patients[label].values())) for label in LABELS},
        "mapping_ids_in_archive": len({row["mapping_id"] for row in rows if row["mapping_id"]}),
        "mapped_images": sum(row["group"] is not None for row in rows),
        "unmatched_mapping_entries": {
            label: len(set(patients[label]) - {
                PurePosixPath(row["member"]).name.casefold() for row in rows if row["label"] == label
            })
            for label in LABELS
        },
        "source_pattern_images": sum(row["source_image"] is not None for row in rows),
        "duplicate_byte_entries": sum(count for count in digests.values() if count > 1),
        "cross_label_duplicate_hashes": sum(len(labels) > 1 for labels in labels_by_digest.values()),
        "split_seed": SPLIT_SEED, "splits": split_summary,
    }

    for key in ("group", "source_image", "sha256"):
        dev_values = {row[key] for row in rows if row["split"] == "development"}
        held_out_values = {row[key] for row in rows if row["split"] == "held-out"}
        if (dev_values & held_out_values) - {None}:
            raise ValueError(f"Detected cross-split leakage for {key}.")
    return rows, audit


def main() -> None:
    rows, audit = build_manifest()
    with MANIFEST.open("w", encoding="utf-8", newline="\n") as output:
        for row in rows:
            output.write(json.dumps(row, sort_keys=True) + "\n")
    audit["manifest_sha256"] = sha256_file(MANIFEST)
    AUDIT.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps(audit, indent=2), flush=True)


if __name__ == "__main__":
    main()
