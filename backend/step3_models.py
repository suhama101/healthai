"""Fixed zero-shot configurations and explicitly supervised frozen-feature heads."""

import math

from backend.assets import LABELS, MODEL_ID, MODEL_REVISION, sha256_file
from backend.clip_model import CellPrediction, ClipClassifier, PROMPTS
from backend.step3_biomed import BIO_ID, BIO_REV, BiomedEncoder
from backend.step3_protocol import ENSEMBLE, METHODS, RIDGE, RUN, SELECTION, read_json

MODEL_DETAILS = {"clip": (MODEL_ID, MODEL_REVISION), "biomed": (BIO_ID, BIO_REV)}
RIDGE_METHODS = {"clip-ridge", "biomed-ridge"}


def load_encoder(family):
    return ClipClassifier() if family == "clip" else BiomedEncoder()


def build_text_bank(encoder, family):
    torch = encoder.torch
    ensemble = encoder.text_embeddings([text for group in ENSEMBLE for text in group])
    ensemble = torch.nn.functional.normalize(ensemble.reshape(2, len(ENSEMBLE[0]), -1).mean(dim=1), dim=-1)
    if family == "clip":
        return {**encoder.text_features, "clip-ensemble": ensemble}
    return {"biomed-class-name": encoder.text_embeddings(PROMPTS["class-name"]), "biomed-ensemble": ensemble}


def fit_head(features, labels, encoder):
    torch = encoder.torch
    x = features.to(torch.float64)
    targets = torch.nn.functional.one_hot(torch.tensor([LABELS.index(label) for label in labels], device=x.device), 2).double()
    center = x.mean(dim=0)
    centered = x - center
    prior = targets.mean(dim=0)
    covariance = centered.T @ centered / len(x)
    regularized = covariance + RIDGE * torch.eye(x.shape[1], device=x.device, dtype=x.dtype)
    weights = torch.linalg.solve(regularized, centered.T @ (targets - prior) / len(x))
    return {"weights": weights.cpu().tolist(), "bias": (prior - center @ weights).cpu().tolist()}


def head_tensors(head, encoder):
    torch = encoder.torch
    weights = torch.tensor(head["weights"], dtype=torch.float64, device=encoder.device)
    bias = torch.tensor(head["bias"], dtype=torch.float64, device=encoder.device)
    if weights.shape != (512, 2) or bias.shape != (2,) or not torch.isfinite(weights).all() or not torch.isfinite(bias).all():
        raise ValueError("Invalid supervised ridge head.")
    return weights, bias


def score_matrix(features, method, bank, head):
    if method in RIDGE_METHODS:
        weights, bias = head
        return features.double() @ weights + bias
    return (features @ bank[method].T).clamp(-1, 1)


def prediction(scores):
    a, b = scores
    if not (math.isfinite(a) and math.isfinite(b)):
        raise ValueError("Model returned a nonfinite score.")
    return CellPrediction("parasitized" if a >= b else "uninfected", dict(zip(LABELS, (a, b), strict=True)))


class DemoModel:
    """Loads only the selected backbone plus its own compatible methods."""

    def __init__(self):
        if not SELECTION.is_file():
            raise RuntimeError("The Step 3 validation lock is missing. Run python -m backend.step3 validation.")
        self.selection = read_json(SELECTION)
        self.family = self.selection["family"]
        self.method = self.selection["selected"]
        if self.method not in METHODS[self.family]:
            raise ValueError("Invalid selected research method.")
        self.model_id, self.revision = MODEL_DETAILS[self.family]
        path = RUN / f"{self.family}-head.json"
        head = None
        if self.method in RIDGE_METHODS:
            if sha256_file(path) != self.selection["head_sha256"][self.family]:
                raise ValueError("Selected head does not match the validation lock.")
            head = read_json(path)
        self.encoder = load_encoder(self.family)
        self.bank = build_text_bank(self.encoder, self.family)
        self.head = head_tensors(head, self.encoder) if head is not None else None
        self.methods = tuple(self.bank) + ((self.method,) if self.head is not None else ())

    def predict(self, image, methods):
        features = self.encoder.image_features([image])
        return {
            method: prediction(score_matrix(features, method, self.bank, self.head)[0].cpu().tolist())
            for method in methods
        }
