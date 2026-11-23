"""Shared bounded image decoding for the API and offline evaluation."""

from io import BytesIO
from struct import error as StructError

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 4 * 1024 * 1024
MAX_EDGE = 4096
FORMATS = {
    "image/jpeg": ("JPEG", b"\xff\xd8\xff"),
    "image/png": ("PNG", b"\x89PNG\r\n\x1a\n"),
}


class ImageError(ValueError):
    pass


def decode_image(contents: bytes, content_type: str) -> Image.Image:
    if not contents or len(contents) > MAX_IMAGE_BYTES:
        raise ImageError("Choose a nonempty image no larger than 10 MiB.")

    expected, signature = FORMATS[content_type]
    if not contents.startswith(signature):
        raise ImageError("The file contents do not match its declared image type.")

    try:
        with Image.open(BytesIO(contents), formats=[expected]) as image:
            if max(image.size) > MAX_EDGE or image.width * image.height > MAX_PIXELS:
                raise ImageError("The image exceeds 4,096 pixels per edge or 4,194,304 total pixels.")
            if getattr(image, "is_animated", False):
                raise ImageError("Choose a single-frame JPEG or PNG.")
            image.verify()
        with Image.open(BytesIO(contents), formats=[expected]) as image:
            image.load()
            return ImageOps.exif_transpose(image).convert("RGB")
    except (Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ImageError("The decoded image is too large.") from exc
    except (UnidentifiedImageError, OSError, SyntaxError, OverflowError, EOFError, StructError) as exc:
        raise ImageError("This image could not be decoded as a valid JPEG or PNG.") from exc
