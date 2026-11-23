"""Pinned, offline Microsoft BiomedCLIP using the OpenCLIP runtime."""

from copy import deepcopy

from backend.assets import CACHE, download, sha256_file
from backend.step3_protocol import read_json

BIO_DIR = CACHE / "biomedclip"
BIO_ID = "microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"
BIO_REV = "9f341de24bfb00180f1b847274256e9b65a3a32e"
BIO_WEIGHT = "open_clip_pytorch_model.bin"
BIO_SHA = "52cc993c5c5ff962bd0c60931874bc001e7e9b41666a385530f4a036294576be"
TEXT_ID = "microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract"
BIO_FILES = {
    "open_clip_config.json": 707, "LICENSE.md": 1072, "tokenizer.json": 679168,
    "tokenizer_config.json": 394, "special_tokens_map.json": 125, "vocab.txt": 225062,
    BIO_WEIGHT: 783705670,
}


class BiomedEncoder:
    def __init__(self):
        import torch
        import open_clip
        from open_clip.model import CustomTextCLIP
        from open_clip.transform import PreprocessCfg, image_transform_v2

        if not (BIO_DIR / BIO_WEIGHT).is_file() or sha256_file(BIO_DIR / BIO_WEIGHT) != BIO_SHA:
            raise RuntimeError("BiomedCLIP weights are missing or invalid. Run python -m backend.step3 assets.")
        torch.set_num_threads(4)
        self.torch = torch
        self.device = torch.device("cpu")
        config = read_json(BIO_DIR / "open_clip_config.json")
        model_config = deepcopy(config["model_cfg"])
        text = model_config["text_cfg"]
        text.update(hf_model_name=str(BIO_DIR), hf_tokenizer_name=str(BIO_DIR), hf_model_pretrained=False)
        self.model = CustomTextCLIP(**model_config)
        state = torch.load(BIO_DIR / BIO_WEIGHT, map_location="cpu", weights_only=True, mmap=True)
        # OpenCLIP's loader drops this legacy buffer for current Transformers.
        state.pop("text.transformer.embeddings.position_ids", None)
        state["logit_scale"] = state["logit_scale"].reshape(self.model.logit_scale.shape)
        self.model.load_state_dict(state, strict=True, assign=True)
        self.model.eval()
        prep = PreprocessCfg(size=model_config["vision_cfg"]["image_size"], **config["preprocess_cfg"])
        self.preprocess = image_transform_v2(prep, is_train=False)
        self.tokenizer = open_clip.get_tokenizer(f"local-dir:{BIO_DIR}")

    def image_features(self, images):
        with self.torch.inference_mode():
            return self.model.encode_image(self.torch.stack([self.preprocess(image) for image in images]), normalize=True)

    def text_embeddings(self, texts):
        with self.torch.inference_mode():
            return self.model.encode_text(self.tokenizer(list(texts)), normalize=True)
