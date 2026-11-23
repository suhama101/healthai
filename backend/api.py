"""Local FastAPI service for MediLens AI. Images are processed in memory."""

import asyncio
from contextlib import asynccontextmanager
import logging
from os import environ
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from starlette.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel
from starlette.requests import ClientDisconnect

from backend.clip_model import METHOD_NAMES, ResearchClass
from backend.images import FORMATS, MAX_IMAGE_BYTES, ImageError, decode_image
from backend.release_assets import verify_cache
from backend.service_config import allowlists
from backend.step3_models import DemoModel, RIDGE_METHODS

LOGGER = logging.getLogger("uvicorn.error")
PROTOCOL = "medilens-clip-v1"
DISCLAIMER = "For research and education only. Do not use for clinical diagnosis or patient care."
ALLOWED_ORIGINS, ALLOWED_HOSTS = allowlists()


class ModelDetails(BaseModel):
    name: str
    version: str


class ScoreDetails(BaseModel):
    kind: Literal["model_score"] = "model_score"
    label: str = "Image–text cosine similarity"
    values: dict[str, float]


class BaselineDetails(ModelDetails):
    predictedClass: ResearchClass


class Prediction(BaseModel):
    predictedClass: ResearchClass
    method: str
    model: ModelDetails
    scores: ScoreDetails
    limitations: list[str]
    baseline: BaselineDetails | None = None


def load_ready_model():
    if environ.get("MEDILENS_VERIFY_RELEASE") == "1":
        verify_cache()
    classifier = DemoModel()
    with Image.new("RGB", (224, 224)) as warmup:
        classifier.predict(warmup, (classifier.method,))
    return classifier


@asynccontextmanager
async def lifespan(app: FastAPI):
    classifier = await run_in_threadpool(load_ready_model)
    app.state.classifier = classifier
    app.state.inference_slot = asyncio.Lock()
    LOGGER.info("Loaded %s at %s using %s", classifier.model_id, classifier.revision, classifier.method)
    yield


app = FastAPI(title="MediLens AI Research API", lifespan=lifespan, openapi_url=None)
app.add_middleware(
    CORSMiddleware, allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"], allow_headers=["Content-Type"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS, www_redirect=False)


@app.get("/live")
async def live():
    return {"status": "alive"}


@app.get("/health")
async def health(request: Request):
    classifier: DemoModel = request.app.state.classifier
    return {"status": "ready", "protocol": PROTOCOL, "model": classifier.model_id,
            "version": classifier.revision, "method": classifier.method, "methods": classifier.methods}


async def read_image(request: Request) -> bytes:
    contents = bytearray()
    try:
        async with asyncio.timeout(15):
            async for chunk in request.stream():
                if len(contents) + len(chunk) > MAX_IMAGE_BYTES:
                    raise HTTPException(413, "Choose an image no larger than 10 MiB.")
                contents.extend(chunk)
    except TimeoutError as exc:
        raise HTTPException(408, "Image upload timed out.") from exc
    except ClientDisconnect as exc:
        raise HTTPException(400, "Image upload was interrupted.") from exc
    return bytes(contents)


@app.post("/predict", response_model=Prediction, response_model_exclude_none=True)
async def predict(request: Request, method: str | None = None):
    origin = request.headers.get("origin")
    if origin is not None and origin not in ALLOWED_ORIGINS:
        raise HTTPException(403, "This browser origin is not approved for inference.")
    classifier: DemoModel = request.app.state.classifier
    method = method if method is not None else classifier.method
    if method not in classifier.methods:
        raise HTTPException(422, "The requested method is not available on the loaded model.")
    content_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if content_type not in FORMATS:
        raise HTTPException(415, "Send an image with Content-Type image/jpeg or image/png.")
    length = request.headers.get("content-length")
    if length is not None and (not length.isdecimal() or len(length) > 20 or int(length) > MAX_IMAGE_BYTES):
        raise HTTPException(413, "Choose an image no larger than 10 MiB.")

    slot = request.app.state.inference_slot
    if slot.locked():
        raise HTTPException(503, "The model is processing another image. Try again shortly.")

    def classify(contents: bytes) -> Prediction:
        with decode_image(contents, content_type) as image:
            methods = ("class-name", "knowledge-guided") if method == "knowledge-guided" else (method,)
            predictions = classifier.predict(image, methods)
        result = predictions[method]
        baseline = None
        if method == "knowledge-guided":
            baseline = BaselineDetails(
                name=METHOD_NAMES["class-name"], version=classifier.revision,
                predictedClass=predictions["class-name"].label,
            )
        limitations = [
            DISCLAIMER,
            "The model always selects one of two cell classes.",
            "The relative scores are uncalibrated.",
            "The prototype has limited cell-level evaluation and no clinical validation.",
        ]
        score_label = "Image–text cosine similarity"
        if method in RIDGE_METHODS:
            score_label = "Uncalibrated ridge model score"
            limitations.append("The supervised ridge head was fitted to labeled NLM development crops with the encoder frozen.")
        return Prediction(
            predictedClass=result.label, method=method,
            model=ModelDetails(name=classifier.model_id, version=classifier.revision),
            scores=ScoreDetails(label=score_label, values=result.scores), limitations=limitations, baseline=baseline,
        )

    async with slot:
        contents = await read_image(request)
        try:
            return await run_in_threadpool(classify, contents)
        except ImageError as exc:
            raise HTTPException(422, str(exc)) from exc
        except Exception:
            LOGGER.error("CLIP inference failed during a request.")
            raise HTTPException(500, "The model could not analyze this image.") from None
