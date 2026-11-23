"""Local FastAPI service for MediLens AI. Images are processed in memory."""

import asyncio
from contextlib import asynccontextmanager
import logging
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel
from starlette.requests import ClientDisconnect

from backend.assets import MODEL_ID, MODEL_REVISION
from backend.clip_model import ClipClassifier, METHOD_NAMES, Method, ResearchClass
from backend.images import FORMATS, MAX_IMAGE_BYTES, ImageError, decode_image

LOGGER = logging.getLogger("uvicorn.error")
PROTOCOL = "medilens-clip-v1"
DISCLAIMER = "For research and education only. Do not use for clinical diagnosis or patient care."
DEVELOPMENT_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]


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
    method: Method
    model: ModelDetails
    scores: ScoreDetails
    limitations: list[str]
    baseline: BaselineDetails | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.classifier = await run_in_threadpool(ClipClassifier)
    app.state.inference_slot = asyncio.Lock()
    LOGGER.info("Loaded %s at %s on %s", MODEL_ID, MODEL_REVISION, app.state.classifier.device)
    yield


app = FastAPI(title="MediLens AI Research API", lifespan=lifespan, docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware, allow_origins=DEVELOPMENT_ORIGINS,
    allow_methods=["GET", "POST"], allow_headers=["Content-Type"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])


@app.get("/health")
async def health():
    return {"status": "ready", "protocol": PROTOCOL, "model": MODEL_ID, "version": MODEL_REVISION}


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
async def predict(request: Request, method: Method = "class-name"):
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
        classifier: ClipClassifier = request.app.state.classifier
        with decode_image(contents, content_type) as image:
            methods = ("class-name", "knowledge-guided") if method == "knowledge-guided" else ("class-name",)
            predictions = classifier.predict([image], methods)
        result = predictions[method][0]
        baseline = None
        if method == "knowledge-guided":
            baseline = BaselineDetails(
                name=METHOD_NAMES["class-name"], version=MODEL_REVISION,
                predictedClass=predictions["class-name"][0].label,
            )
        limitations = [
            DISCLAIMER,
            "This general-purpose CLIP model always selects one of two cell classes.",
            "The cosine similarities are uncalibrated model scores.",
            "The prototype has limited cell-level evaluation and no clinical validation.",
        ]
        if method == "knowledge-guided":
            limitations.append("The experimental prompts identified 7 of 128 labeled parasitized crops in the initial held-out sample.")
        else:
            limitations.append("This baseline predicted parasitized for all 256 crops in the initial held-out sample.")
        return Prediction(
            predictedClass=result.label, method=method, model=ModelDetails(name=MODEL_ID, version=MODEL_REVISION),
            scores=ScoreDetails(values=result.scores), limitations=limitations, baseline=baseline,
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
