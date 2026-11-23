from io import BytesIO

from PIL import Image
import pytest

from backend.images import ImageError, decode_image


@pytest.mark.parametrize(("format", "media_type"), [("PNG", "image/png"), ("JPEG", "image/jpeg")])
def test_decode_supported_bytes(format, media_type):
    buffer = BytesIO()
    Image.new("RGB", (16, 12)).save(buffer, format)
    with decode_image(buffer.getvalue(), media_type) as image:
        assert image.mode == "RGB"
        assert image.size == (16, 12)


def test_decode_rejects_wrong_signature_and_excessive_dimensions():
    with pytest.raises(ImageError, match="declared image type"):
        decode_image(b"not an image", "image/png")

    buffer = BytesIO()
    Image.new("RGB", (4097, 1)).save(buffer, "PNG")
    with pytest.raises(ImageError, match="pixels per edge"):
        decode_image(buffer.getvalue(), "image/png")


def test_decode_rejects_truncated_and_multiframe_png():
    with pytest.raises(ImageError, match="decoded"):
        decode_image(b"\x89PNG\r\n\x1a\n" + b"partial", "image/png")

    buffer = BytesIO()
    Image.new("RGB", (12, 12), "red").save(
        buffer, "PNG", save_all=True, append_images=[Image.new("RGB", (12, 12), "blue")],
    )
    with pytest.raises(ImageError, match="single-frame"):
        decode_image(buffer.getvalue(), "image/png")
