import os
import tempfile
import logging
import json
from fastapi import Request, Response, status, HTTPException, UploadFile
from fastapi.responses import FileResponse
from graph.run import run_generate_report_pipeline
from src.db.connection import PostgresConnectionPool

logger = logging.getLogger(__name__)

SAMPLE_REPORTS_FOLDER = "assets/knowledge_base/sample_reports"
# TODO: after professor demo, replace all static asset paths with Dropbox storage calls
# Assets should be fetched from the shared app test Dropbox account instead of local files
REPORT_TEMPLATE_PATH = "assets/knowledge_base/report_templates/template1.docx"
REPORT_TEMPLATE_NAME = "report_template_1_doc"


def _load_tags_from_db(project_id: str) -> str | None:
    try:
        with PostgresConnectionPool().get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT tags_json FROM agent_state WHERE project_id = %s",
                    (project_id,)
                )
                row = cur.fetchone()
                return row[0] if row else None
    except Exception as e:
        logger.error(f"Failed to load tags from db: {e}")
        return None


def _merge_local_tags(existing_list: list, local_tags: list[dict]) -> list:
    existing_by_name = {
        item.get("image_name"): item for item in existing_list if item.get("image_name")
    }

    for local_item in local_tags:
        img_name = local_item.get("image_name")
        tags = local_item.get("tags", [])
        if not img_name:
            continue

        if img_name in existing_by_name:
            existing_by_name[img_name]["tags"] = tags
        else:
            new_entry = {
                "image_name": img_name,
                "tags": tags,
                "location_desc": "",
                "manual_ref": [],
                "manual_ref_description": [],
                "internet_ref_links": [],
                "internet_ref_description": "",
            }
            existing_list.append(new_entry)
            existing_by_name[img_name] = new_entry

    return existing_list


def _sync_local_tags_with_db(project_id: str, local_tags: list[dict]) -> str | None:
    existing_tags_json = _load_tags_from_db(project_id)
    existing_list: list = []
    if existing_tags_json:
        try:
            existing_list = json.loads(existing_tags_json)
            if not isinstance(existing_list, list):
                existing_list = []
        except Exception as e:
            logger.error(f"Failed to parse existing tags_json: {e}")
            existing_list = []

    merged_list = _merge_local_tags(existing_list, local_tags)
    updated_tags_json = json.dumps(merged_list)

    try:
        with PostgresConnectionPool().get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO agent_state (user_id, project_id, status, tags_json, generated_report, evaluation_result)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (project_id) DO UPDATE SET
                        tags_json = EXCLUDED.tags_json,
                        updated_at = CURRENT_TIMESTAMP
                """, (
                    "test_user",
                    project_id,
                    "tags_extracted",
                    updated_tags_json,
                    None,
                    None,
                ))
                conn.commit()
    except Exception as e:
        logger.error(f"Failed to persist synced tags to db: {e}")

    return updated_tags_json if merged_list else None


async def handle_generate_report(
    request: Request,
    response: Response,
    project_id: str,
    user_instruction: str = "",
    representing_party: str = "",
    report_context: dict | None = None,
    email_attachments: list[UploadFile] | None = None,
    bill_attachments: list[UploadFile] | None = None,
    local_tags: list[dict] | None = None,
):
    if local_tags is not None:
        tags_json = _sync_local_tags_with_db(project_id, local_tags)
        if not tags_json:
            tags_json = _load_tags_from_db(project_id)
    else:
        tags_json = _load_tags_from_db(project_id)

    if not tags_json or tags_json.strip() in ("", "[]"):
        raise HTTPException(
            status_code=404,
            detail=(
                f"No tags found for project {project_id}. "
                "Tag images locally or run extract-features first."
            ),
        )

    sample_report_paths = [
        os.path.join(SAMPLE_REPORTS_FOLDER, f)
        for f in os.listdir(SAMPLE_REPORTS_FOLDER)
        if f.lower().endswith((".pdf", ".md"))
    ]

    email_attachments = email_attachments or []
    bill_attachments = bill_attachments or []
    email_payload: list[dict] = []
    bill_payload: list[dict] = []

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

    result = run_generate_report_pipeline(
        project_id=project_id,
        tags_json=tags_json,
        report_template_path=REPORT_TEMPLATE_PATH,
        report_template_name=REPORT_TEMPLATE_NAME,
        sample_report_paths=sample_report_paths,
        user_instruction=user_instruction,
        representing_party=representing_party,
        report_context=report_context or {},
        email_attachments=email_payload,
        bill_attachments=bill_payload,
    )

    if result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])

    doc_bytes = result["generated_report_bytes"]
    if not doc_bytes:
        raise HTTPException(status_code=500, detail="Report generation produced no output")

    tmp_path = f"/tmp/report_{project_id}.docx"
    with open(tmp_path, "wb") as f:
        f.write(doc_bytes)

    return FileResponse(
        path=tmp_path,
        filename=f"Project_Report_{project_id}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
