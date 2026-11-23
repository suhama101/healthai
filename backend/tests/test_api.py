import json
from zipfile import ZipFile

from fastapi.testclient import TestClient
import pytest

from backend.api import app
from backend.assets import ARCHIVE, DATASET_DIR, LABELS, MODEL_DIR, MODEL_ID, MODEL_REVISION, WEIGHTS
from backend.dataset import MANIFEST
from backend.images import MAX_IMAGE_BYTES


@pytest.fixture(scope="module")
def client():
    if not (MODEL_DIR / WEIGHTS).is_file():
        pytest.skip("Download the pinned weights to run real API tests.")
    with TestClient(app, base_url="http://127.0.0.1") as connected:
        yield connected


def test_ready_and_restricted_cors(client):
    health = client.get("/health").json()
    assert health == {"status": "ready", "protocol": "medilens-clip-v1", "model": MODEL_ID, "version": MODEL_REVISION}
    assert client.get("/health", headers={"Host": "unapproved.example"}).status_code == 400
    for origin, expected in [("http://localhost:3000", 200), ("https://unknown.example", 400)]:
        response = client.options("/predict", headers={
            "Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Content-Type",
        })
        assert response.status_code == expected
        assert (response.headers.get("access-control-allow-origin") == origin) == (expected == 200)


def test_rejects_unsupported_invalid_and_oversized(client):
    assert client.post("/predict", content=b"text", headers={"Content-Type": "text/plain"}).status_code == 415
    png = {"Content-Type": "image/png"}
    assert client.post("/predict", content=b"text", headers=png).status_code == 422
    assert client.post("/predict", content=b"", headers=png).status_code == 422
    assert client.post("/predict", content=b"data", headers={**png, "Content-Length": str(MAX_IMAGE_BYTES + 1)}).status_code == 413
    assert client.post("/predict", content=b"0" * (MAX_IMAGE_BYTES + 1),
                       headers={**png, "Content-Length": "1"}).status_code == 413


def test_real_model_scores_public_labeled_images(client):
    if not MANIFEST.is_file():
        pytest.skip("Build the official dataset manifest to run this test.")
    rows = [json.loads(line) for line in MANIFEST.read_text(encoding="utf-8").splitlines()]
    headers = {"Content-Type": "image/png"}
    responses = []
    with ZipFile(DATASET_DIR / ARCHIVE) as archive:
        for label in LABELS:
            row = next(row for row in rows if row["split"] == "development" and row["label"] == label)
            data = archive.read(row["member"])
            baseline = client.post("/predict", content=data, headers=headers)
            guided = client.post("/predict?method=knowledge-guided", content=data, headers=headers)
            assert baseline.status_code == guided.status_code == 200
            assert baseline.json() == client.post("/predict", content=data, headers=headers).json()
            primary, experiment = baseline.json(), guided.json()
            assert primary["method"] == "class-name"
            assert experiment["method"] == "knowledge-guided"
            assert experiment["baseline"]["predictedClass"] == primary["predictedClass"]
            for result in (primary, experiment):
                values = result["scores"]["values"]
                assert result["model"] == {"name": MODEL_ID, "version": MODEL_REVISION}
                assert result["scores"]["kind"] == "model_score"
                assert set(values) == set(LABELS) and all(-1 <= score <= 1 for score in values.values())
                assert result["predictedClass"] == max(values, key=values.get)
            responses.append(primary["scores"]["values"])
    assert responses[0] != responses[1]
