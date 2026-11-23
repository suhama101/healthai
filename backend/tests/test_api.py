from zipfile import ZipFile

from fastapi.testclient import TestClient
import pytest

from backend.api import app
from backend.assets import ARCHIVE, DATASET_DIR, LABELS
from backend.images import MAX_IMAGE_BYTES
from backend.step3_models import MODEL_DETAILS, RIDGE_METHODS
from backend.step3_protocol import PROTOCOL, SELECTION, partition, read_json


@pytest.fixture(scope="module")
def client():
    if not SELECTION.is_file():
        pytest.skip("Run Step 3 validation to test the real selected service.")
    with TestClient(app, base_url="http://127.0.0.1") as connected:
        yield connected


def test_ready_and_restricted_cors(client):
    assert client.get("/live").json() == {"status": "alive"}
    assert client.get("/openapi.json").status_code == 404
    selection = read_json(SELECTION)
    model, version = MODEL_DETAILS[selection["family"]]
    health = client.get("/health").json()
    assert health["status"] == "ready" and health["protocol"] == "medilens-clip-v1"
    assert (health["model"], health["version"], health["method"]) == (model, version, selection["selected"])
    assert selection["selected"] in health["methods"]
    assert client.get("/health", headers={"Host": "unapproved.example"}).status_code == 400
    assert client.post("/predict", headers={"Origin": "https://unknown.example"}).status_code == 403
    for origin, expected in [("http://localhost:3000", 200), ("https://unknown.example", 400)]:
        response = client.options("/predict", headers={
            "Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Content-Type",
        })
        assert response.status_code == expected
        assert (response.headers.get("access-control-allow-origin") == origin) == (expected == 200)


def test_rejects_unsupported_invalid_and_oversized(client):
    assert client.post("/predict", content=b"text", headers={"Content-Type": "text/plain"}).status_code == 415
    png = {"Content-Type": "image/png"}
    assert client.post("/predict?method=unavailable", content=b"text", headers=png).status_code == 422
    assert client.post("/predict", content=b"text", headers=png).status_code == 422
    assert client.post("/predict", content=b"", headers=png).status_code == 422
    assert client.post("/predict", content=b"data", headers={**png, "Content-Length": str(MAX_IMAGE_BYTES + 1)}).status_code == 413
    assert client.post("/predict", content=b"0" * (MAX_IMAGE_BYTES + 1),
                       headers={**png, "Content-Length": "1"}).status_code == 413


def test_busy_service_rejects_while_health_stays_ready(client):
    slot = app.state.inference_slot
    client.portal.call(slot.acquire)
    try:
        assert client.get("/health").json()["status"] == "ready"
        assert client.post("/predict", content=b"image", headers={"Content-Type": "image/png"}).status_code == 503
    finally:
        client.portal.call(slot.release)


def test_selected_model_uses_real_development_images(client, tmp_path, monkeypatch):
    if not PROTOCOL.is_file():
        pytest.skip("Prepare the official dataset manifest for this test.")
    monkeypatch.chdir(tmp_path)
    health = client.get("/health").json()
    rows = partition("development", read_json(PROTOCOL))
    headers = {"Content-Type": "image/png"}
    predicted = set()
    score_vectors = set()
    with ZipFile(DATASET_DIR / ARCHIVE) as archive:
        for label in LABELS:
            examples = [row for row in rows if row["label"] == label][:6]
            for index, row in enumerate(examples):
                data = archive.read(row["member"])
                response = client.post("/predict", content=data, headers=headers)
                assert response.status_code == 200
                result = response.json()
                if index == 0:
                    assert result == client.post("/predict", content=data, headers=headers).json()
                assert result["method"] == health["method"]
                assert result["model"] == {"name": health["model"], "version": health["version"]}
                scores = result["scores"]
                assert scores["kind"] == "model_score"
                assert list(scores["values"]) == list(LABELS)
                assert "ridge" in scores["label"].lower() if health["method"] in RIDGE_METHODS else "cosine" in scores["label"]
                assert result["predictedClass"] == max(scores["values"], key=scores["values"].get)
                predicted.add(result["predictedClass"])
                score_vectors.add(tuple(scores["values"].values()))
    assert predicted == set(LABELS) and len(score_vectors) > 2
    assert not list(tmp_path.iterdir())
