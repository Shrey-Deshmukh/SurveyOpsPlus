import logging
import uuid
from fastapi import Response, UploadFile, status, HTTPException
from graph.run import run_extract_features_pipeline_from_bytes
from src.constants import (
    MANUAL_DOC_PATH,
    MANUAL_DOC_NAME,
    ALLOWED_IMAGE_TYPES,
    EXTRACT_FEATURES_MAX_BATCH_SIZE,
    COMPLIANCE_DOCS_DIR,
)

logger = logging.getLogger(__name__)


def _validate_image_batch(image_batch: list[UploadFile]) -> None:
    if not image_batch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one image is required.",
        )
    if len(image_batch) > EXTRACT_FEATURES_MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"At most {EXTRACT_FEATURES_MAX_BATCH_SIZE} images per request.",
        )
    for image in image_batch:
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=(
                    f"Unsupported file type: {image.content_type}. "
                    f"Allowed: {ALLOWED_IMAGE_TYPES}"
                ),
            )


async def handle_extract_features(
    response: Response,
    image_batch: list[UploadFile],
    project_id: str | None = None,
) -> dict:
    _validate_image_batch(image_batch)

    effective_project_id = (project_id or "").strip() or str(uuid.uuid4())
    results: list[dict] = []

    for image in image_batch:
        if not image.filename:
            logger.debug("Received image without filename; using default placeholder.")
        image_filename = image.filename or "upload"
        try:
            image_bytes = await image.read()
            result = run_extract_features_pipeline_from_bytes(
                user_id="test_user",
                project_id=effective_project_id,
                image_bytes=image_bytes,
                image_mime_type=image.content_type or "image/jpeg",
                image_filename=image_filename,
                manual_doc_path=MANUAL_DOC_PATH,
                manual_doc_name=MANUAL_DOC_NAME,
                compliance_docs_dir=COMPLIANCE_DOCS_DIR,
            )
        except Exception as exc:
            logger.exception("extract-features failed for %s", image_filename)
            print(f"extract-features failed for {image_filename}: {exc}")
            results.append(
                {
                    "filename": image_filename,
                    "tags": [],
                    "error": str(exc),
                }
            )
            continue

        if result.get("error"):
            logger.error(
                "extract-features pipeline error for %s: %s",
                image_filename,
                result["error"],
            )
            results.append(
                {
                    "filename": image_filename,
                    "tags": [],
                    "error": result["error"],
                }
            )
        else:
            results.append(
                {
                    "filename": image_filename,
                    "tags": result["tags_json"],
                    "error": None,
                }
            )

    # Always 200 so the client can apply per-image success/failure (avoids whole-batch 500 retries).
    response.status_code = status.HTTP_200_OK
    return {
        "project_id": effective_project_id,
        "results": results,
    }
