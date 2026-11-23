from hashlib import sha256
from zipfile import ZipFile

import pytest

from backend import release_assets
from backend.service_config import allowlists


def test_exact_bundle_round_trip_and_conflict(tmp_path, monkeypatch):
    head = b'{"weights":[]}'
    selection = b'{"selected":"clip-ridge"}'
    fixture = {"step3/clip-head.json": head, "step3/selection.json": selection}
    lock = {"bundle": {name: {"size": len(data), "sha256": sha256(data).hexdigest()}
                       for name, data in fixture.items()}, "checkpointFiles": {}}
    monkeypatch.setattr(release_assets, "release_lock", lambda: lock)
    source = tmp_path / "source"
    (source / "step3").mkdir(parents=True)
    for name, data in fixture.items():
        (source / name).write_bytes(data)

    bundle = tmp_path / "head.zip"
    destination = tmp_path / "destination"
    release_assets.pack_bundle(bundle, source)
    release_assets.install_bundle(bundle, destination)
    release_assets.install_bundle(bundle, destination)
    release_assets.verify_cache(destination)
    (destination / "step3/selection.json").write_bytes(b"conflict")
    with pytest.raises(ValueError, match="Refusing to replace"):
        release_assets.install_bundle(bundle, destination)


def test_bundle_rejects_unexpected_members_before_install(tmp_path):
    bundle = tmp_path / "invalid.zip"
    with ZipFile(bundle, "w") as archive:
        archive.writestr("../outside", "unexpected")
    with pytest.raises(ValueError, match="Unexpected"):
        release_assets.install_bundle(bundle, tmp_path / "cache")
    assert not (tmp_path / "outside").exists()
    assert not (tmp_path / "cache").exists()


def test_https_origin_and_exact_host_validation():
    origins, hosts = allowlists({"MEDILENS_ALLOWED_ORIGINS": "https://jury.example.org",
                                "MEDILENS_ALLOWED_HOSTS": "api.example.org,127.0.0.1"})
    assert origins == ("https://jury.example.org",)
    assert hosts == ("api.example.org", "127.0.0.1")
    for origin in ("*", "http://jury.example.org", "https://jury.example.org/", "https://user@jury.example.org"):
        with pytest.raises(ValueError, match="origins"):
            allowlists({"MEDILENS_ALLOWED_ORIGINS": origin})
    for host in ("*", "api.example.org:443", "https://api.example.org"):
        with pytest.raises(ValueError, match="hosts"):
            allowlists({"MEDILENS_ALLOWED_HOSTS": host})
