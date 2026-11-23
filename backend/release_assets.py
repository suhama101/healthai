"""Verify and transfer the exact local Step 3 artifacts without training."""

import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_STORED, ZipFile, ZipInfo

from backend.assets import CACHE, MODEL_DIR, sha256_file

LOCK = Path(__file__).with_name("release-lock.json")


def release_lock() -> dict:
    return json.loads(LOCK.read_text(encoding="utf-8"))


def verify_cache(cache: Path = CACHE) -> None:
    lock = release_lock()
    for name, item in lock["bundle"].items():
        path = cache / name
        if not path.is_file() or path.stat().st_size != item["size"] or sha256_file(path) != item["sha256"]:
            raise ValueError(f"Missing or changed frozen artifact: {name}. Install the exact private release bundle.")
    for name, digest in lock["checkpointFiles"].items():
        path = cache / MODEL_DIR.name / name
        if not path.is_file() or sha256_file(path) != digest:
            raise ValueError(f"Missing or changed pinned CLIP asset: {name}. Stage and verify the official checkpoint.")


def pack_bundle(bundle: Path, cache: Path = CACHE) -> None:
    verify_cache(cache)
    bundle.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(bundle, "x") as archive:
        for name in release_lock()["bundle"]:
            entry = ZipInfo(name)
            entry.compress_type = ZIP_STORED
            archive.writestr(entry, (cache / name).read_bytes())


def install_bundle(bundle: Path, cache: Path = CACHE) -> None:
    files = release_lock()["bundle"]
    with ZipFile(bundle) as archive:
        if sorted(archive.namelist()) != sorted(files):
            raise ValueError("Unexpected release bundle members.")
        contents = {}
        for name, item in files.items():
            if archive.getinfo(name).file_size != item["size"]:
                raise ValueError(f"Invalid release bundle size: {name}.")
            value = archive.read(name)
            if hashlib.sha256(value).hexdigest() != item["sha256"]:
                raise ValueError(f"Release bundle digest mismatch: {name}.")
            contents[name] = value

    for name, value in contents.items():
        path = cache / name
        if path.exists() and sha256_file(path) != hashlib.sha256(value).hexdigest():
            raise ValueError(f"Refusing to replace an existing different artifact: {name}. Use a fresh cache.")
    for name, value in contents.items():
        path = cache / name
        if not path.exists():
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open("xb") as output:
                output.write(value)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["verify", "pack", "install"])
    parser.add_argument("bundle", type=Path, nargs="?")
    parser.add_argument("--cache", type=Path, default=CACHE, help="Cache directory for verification or transfer")
    args = parser.parse_args()
    if args.action == "verify":
        if args.bundle is not None:
            parser.error("verify accepts no bundle.")
        verify_cache(args.cache)
        print("Frozen selection, ridge coefficients, and CLIP assets verified.")
    elif args.bundle is None:
        parser.error("pack and install require a bundle path.")
    elif args.action == "pack":
        pack_bundle(args.bundle, args.cache)
        print(f"Private bundle SHA-256 {sha256_file(args.bundle)}")
    else:
        install_bundle(args.bundle, args.cache)
        print("Installed the two exact frozen artifacts. Use verify after staging the CLIP checkpoint.")


if __name__ == "__main__":
    main()
