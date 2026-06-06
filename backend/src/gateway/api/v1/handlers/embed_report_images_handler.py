import base64
import logging
from typing import Any

from fastapi import HTTPException
from pydantic import BaseModel, Field

from utils.report_image_embedder import embed_images_into_docx

logger = logging.getLogger(__name__)

MAX_IMAGES = 200
MAX_B64_CHARS_PER_IMAGE = 35_000_000  # ~26MB binary


class EmbedImageItem(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=512)
    image_base64: str = Field(..., min_length=1)
    content_type: str = Field(default="image/jpeg", max_length=128)
    description: str | None = None


class EmbedReportImagesBody(BaseModel):
    report_base64: str = Field(..., min_length=1)
    images: list[EmbedImageItem] = Field(default_factory=list)


def handle_embed_report_images(body: EmbedReportImagesBody) -> dict[str, Any]:
    if len(body.images) > MAX_IMAGES:
        raise HTTPException(
            status_code=400, detail=f"Too many images (max {MAX_IMAGES})"
        )

    try:
        doc_bytes = base64.b64decode(body.report_base64, validate=True)
    except Exception as e:
        logger.warning("Invalid report_base64: %s", e)
        raise HTTPException(status_code=400, detail="Invalid report_base64") from e

    if not doc_bytes:
        raise HTTPException(status_code=400, detail="Empty report document")

    ordered: list[tuple[str, bytes, str | None]] = []
    for item in body.images:
        if len(item.image_base64) > MAX_B64_CHARS_PER_IMAGE:
            raise HTTPException(
                status_code=400, detail="Single image payload too large"
            )

        try:
            raw = base64.b64decode(item.image_base64, validate=True)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image_base64 for {item.display_name}",
            ) from e

        if not raw:
            continue

        ordered.append((item.display_name.strip(), raw, item.description))

    try:
        new_bytes, placeholders = embed_images_into_docx(doc_bytes, ordered)
    except Exception as e:
        logger.exception("embed_images_into_docx failed")
        raise HTTPException(
            status_code=500, detail=f"Failed to embed images: {e}"
        ) from e

    return {
        "report_base64": base64.b64encode(new_bytes).decode("ascii"),
        # Placeholder names still present in the doc (not yet embedded/stripped).
        "placeholder_names_matched": placeholders,
    }
