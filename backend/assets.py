"""Fetch fixed public research inputs into a Git-ignored directory."""

import argparse
import hashlib
from pathlib import Path
from urllib.request import urlopen

CACHE = Path(__file__).resolve().parents[1] / ".medilens"
MODEL_DIR = CACHE / "model"
DATASET_DIR = CACHE / "dataset"
MODEL_ID = "openai/clip-vit-base-patch32"
MODEL_REVISION = "3d74acf9a28c67741b2f4f2ea7635f0aaf6f0268"
WEIGHTS = "pytorch_model.bin"
WEIGHTS_SHA256 = "a63082132ba4f97a80bea76823f544493bffa8082296d62d71581a4feff1576f"
DATASET_SOURCE = "https://data.lhncbc.nlm.nih.gov/public/Malaria"
ARCHIVE = "cell_images.zip"
LABELS = ("parasitized", "uninfected")
MAPPINGS = {label: f"patientid_cellmapping_{label}.csv" for label in LABELS}

MODEL_FILES = {
    "config.json": 4186,
    "preprocessor_config.json": 316,
    "tokenizer.json": 2224041,
    "tokenizer_config.json": 592,
    "special_tokens_map.json": 389,
    "vocab.json": 862328,
    "merges.txt": 524657,
    WEIGHTS: 605247071,
}
DATASET_FILES = {
    ARCHIVE: 353452851,
    MAPPINGS["parasitized"]: 761124,
    MAPPINGS["uninfected"]: 667059,
}


def sha256_file(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def download(url: str, path: Path, size: int, digest: str | None = None) -> None:
    def matches(candidate: Path) -> bool:
        return (
            candidate.is_file()
            and candidate.stat().st_size == size
            and (digest is None or sha256_file(candidate) == digest)
        )

    if matches(path):
        print(f"Ready: {path.name}", flush=True)
        return

    path.parent.mkdir(parents=True, exist_ok=True)
    partial = path.with_suffix(path.suffix + ".part")
    print(f"Downloading {path.name} ({size:,} bytes)", flush=True)
    try:
        with urlopen(url, timeout=60) as response, partial.open("wb") as output:
            downloaded = 0
            while chunk := response.read(1024 * 1024):
                downloaded += len(chunk)
                if downloaded > size:
                    raise RuntimeError(f"Upstream size changed for {path.name}")
                output.write(chunk)
        if not matches(partial):
            raise RuntimeError(f"Size or SHA-256 verification failed for {path.name}")
        partial.replace(path)
        print(f"Ready: {path.name}", flush=True)
    finally:
        partial.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("asset", choices=["model", "dataset"])
    args = parser.parse_args()
    if args.asset == "model":
        source = f"https://huggingface.co/{MODEL_ID}/resolve/{MODEL_REVISION}"
        for name, size in MODEL_FILES.items():
            download(f"{source}/{name}", MODEL_DIR / name, size, WEIGHTS_SHA256 if name == WEIGHTS else None)
    else:
        for name, size in DATASET_FILES.items():
            download(f"{DATASET_SOURCE}/{name}", DATASET_DIR / name, size)


if __name__ == "__main__":
    main()
