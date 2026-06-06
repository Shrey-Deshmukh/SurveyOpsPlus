import json
import logging
from typing import Any

from fastapi import HTTPException, UploadFile, status

from llm.gemini import utils as gemini_utils
from llm.prompts.prompts import metadata_autofill_prompt
from utils.gemini_helpers import upload_report_attachments
from utils.llm_client import getLLMClient, resolve_google_model

logger = logging.getLogger(__name__)

_METADATA_RESPONSE_KEYS = (
    "container_id",
    "vessel_name",
    "voyage_no",
    "operator",
    "port_of_loading",
    "port_of_discharge",
    "inspection_date",
    "inspection_time",
)
_PROJECT_RESPONSE_KEYS = (
    "project_name",
    "survey_details",
    "instructions",
    "status",
    "location",
    "date",
    "representing_party",
)


def _to_normalized_optional_string(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, (int, float, bool)):
        value = str(value)
    if not isinstance(value, str):
        return None
    trimmed = value.strip()
    return trimmed or None


def _parse_autofill_payload(
    raw_response_text: str,
    keys: tuple[str, ...],
) -> dict[str, str | None]:
    cleaned = raw_response_text.strip().replace("```json", "").replace("```", "")
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Expected JSON object")

    return {
        key: _to_normalized_optional_string(parsed.get(key))
        for key in keys
    }


async def handle_autofill_metadata(
    email_attachments: list[UploadFile] | None = None,
    bill_attachments: list[UploadFile] | None = None,
) -> dict[str, dict[str, str | None]]:
    email_attachments = email_attachments or []
    bill_attachments = bill_attachments or []
    if not email_attachments and not bill_attachments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one email or bill attachment.",
        )

    email_payload: list[dict[str, Any]] = []
    bill_payload: list[dict[str, Any]] = []
    for attachment in email_attachments:
        email_payload.append(
            {
                "filename": attachment.filename or "email_attachment",
                "mime_type": attachment.content_type or "application/octet-stream",
                "bytes": await attachment.read(),
            }
        )
    for attachment in bill_attachments:
        bill_payload.append(
            {
                "filename": attachment.filename or "bill_attachment",
                "mime_type": attachment.content_type or "application/octet-stream",
                "bytes": await attachment.read(),
            }
        )

    client = getLLMClient("google")
    model_name = resolve_google_model()
    uploaded_email_attachments, email_attachment_names = upload_report_attachments(
        client,
        email_payload,
        "Email Attachment",
    )
    uploaded_bill_attachments, bill_attachment_names = upload_report_attachments(
        client,
        bill_payload,
        "Bill Attachment",
    )
    context_files = [*uploaded_email_attachments, *uploaded_bill_attachments]
    if not context_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable attachments were uploaded for metadata inference.",
        )

    prompt = metadata_autofill_prompt(
        email_attachment_names=email_attachment_names,
        bill_attachment_names=bill_attachment_names,
    )
    response, err = gemini_utils.prompt_with_multi_image_with_context(
        client,
        prompt,
        context_files,
        [],
        model_name,
    )
    if err or response is None:
        logger.error("metadata autofill failed: %s", err)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Metadata inference failed. Please try again.",
        )

    try:
        metadata = _parse_autofill_payload(response.text, _METADATA_RESPONSE_KEYS)
        project = _parse_autofill_payload(response.text, _PROJECT_RESPONSE_KEYS)
    except Exception as exc:
        logger.exception("Failed to parse metadata autofill response")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Invalid metadata inference response: {exc}",
        ) from exc

    return {"metadata": metadata, "project": project}
