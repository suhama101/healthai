"""General-purpose CLIP scoring with two fixed, documented prompt sets."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal

from backend.assets import LABELS, MODEL_DIR, MODEL_ID, MODEL_REVISION, WEIGHTS, WEIGHTS_SHA256, sha256_file

if TYPE_CHECKING:
    from PIL import Image

ResearchClass = Literal["parasitized", "uninfected"]
Method = Literal["class-name", "knowledge-guided"]
METHODS: tuple[Method, ...] = ("class-name", "knowledge-guided")
METHOD_NAMES: dict[Method, str] = {
    "class-name": "Class-name CLIP baseline",
    "knowledge-guided": "Knowledge-guided CLIP prompt experiment",
}
PROMPTS: dict[Method, tuple[str, str]] = {
    "class-name": (
        "A thin blood smear image of a parasitized red blood cell.",
        "A thin blood smear image of an uninfected red blood cell.",
    ),
    "knowledge-guided": (
        "A Giemsa-stained red blood cell containing a delicate malaria parasite ring with a small dark chromatin dot.",
        "A Giemsa-stained red blood cell with pale pink cytoplasm and no visible intracellular parasite ring or chromatin dot.",
    ),
}


@dataclass(frozen=True)
class CellPrediction:
    label: ResearchClass
    scores: dict[str, float]


class ClipClassifier:
    def __init__(self) -> None:
        import torch
        from transformers import CLIPImageProcessor, CLIPModel, CLIPTokenizerFast

        weights = MODEL_DIR / WEIGHTS
        if not weights.is_file() or sha256_file(weights) != WEIGHTS_SHA256:
            raise RuntimeError("The pinned CLIP weights are missing or invalid. Run python -m backend.assets model.")

        self.torch = torch
        torch.set_num_threads(4)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.image_processor = CLIPImageProcessor.from_pretrained(MODEL_DIR, local_files_only=True)
        self.tokenizer = CLIPTokenizerFast.from_pretrained(MODEL_DIR, local_files_only=True)
        self.model = CLIPModel.from_pretrained(
            MODEL_DIR, local_files_only=True, use_safetensors=False, weights_only=True, dtype=torch.float32,
        ).to(self.device).eval()
        prompts = [prompt for method in METHODS for prompt in PROMPTS[method]]
        embeddings = self.text_embeddings(prompts)
        self.text_features = dict(zip(METHODS, embeddings.chunk(len(METHODS)), strict=True))

    def text_embeddings(self, prompts):
        tokens = self.tokenizer(list(prompts), padding=True, return_tensors="pt").to(self.device)
        with self.torch.inference_mode():
            return self.torch.nn.functional.normalize(self.model.get_text_features(**tokens), dim=-1)

    def image_features(self, images: Sequence[Image.Image]):
        with self.torch.inference_mode():
            pixels = self.image_processor(images=list(images), return_tensors="pt").pixel_values.to(self.device)
            return self.torch.nn.functional.normalize(self.model.get_image_features(pixel_values=pixels), dim=-1)

    def predict(
        self, images: Sequence[Image.Image], methods: tuple[Method, ...] = METHODS,
    ) -> dict[Method, list[CellPrediction]]:
        with self.torch.inference_mode():
            features = self.image_features(images)
            results = {}
            for method in methods:
                scores = (features @ self.text_features[method].T).clamp(-1.0, 1.0)
                results[method] = [
                    CellPrediction(
                        label="parasitized" if parasitized >= uninfected else "uninfected",
                        scores=dict(zip(LABELS, (parasitized, uninfected), strict=True)),
                    )
                    for parasitized, uninfected in scores.cpu().tolist()
                ]
            return results
