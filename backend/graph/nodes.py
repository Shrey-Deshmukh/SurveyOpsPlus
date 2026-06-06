# graph/nodes.py
import time
import random
import json
import logging
import glob
import os
from llm.gemini import utils as gemini_utils
from graph.state import SurveyState
from llm.prompts.prompts import multi_image_tag_extraction_prompt_tagged, report_generation_prompt_tagged, evaluate_reports_prompt
from utils.llm_client import getLLMClient
from utils.file import write_to_file
from utils.gemini_helpers import (
    get_or_upload_manual,
    upload_with_retry,
    upload_images,
    upload_sample_reports,
    upload_report_attachments,
)
from utils.template_utils import extract_template_tags, fill_template
from llm.prompts.prompts import structured_report_generation_prompt
from evaluation.judge_llm import evaluate_reports
from src.db.connection import PostgresConnectionPool

# module-level cache for uploaded static files
_uploaded_sample_reports_cache: list = []
_uploaded_sample_report_names_cache: str = ""

# module-level cache for compliance docs
_uploaded_compliance_docs_cache: list = []
_compliance_doc_names_cache: str = ""

_template_tags_cache: list = []
LOGGER = logging.getLogger(__name__)


def _to_template_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float, bool)):
        return str(value)
    try:
        return json.dumps(value, ensure_ascii=True)
    except Exception:
        return str(value)

def load_knowledge_base(state: SurveyState) -> SurveyState:
    # TODO: wire up object storage layer
    return state


def extract_tags(state: SurveyState) -> SurveyState:
    # TODO: refactor to use LangGraph OOTB client initialization
    # See GitHub issue — assigned to Rich
    if state.error:
        return state

    client = getLLMClient("google")

    manual_ref, err = get_or_upload_manual(
        client, state.manual_doc_path, state.manual_doc_name
    )
    if err:
        state.error = err
        return state

    uploaded_images, comma_separated_image_names = upload_images(client, state.image_paths)

    tag_prompt = multi_image_tag_extraction_prompt_tagged(
        f"[Attached Reference Manual: {manual_ref.display_name}]",
        comma_separated_image_names,
    )

    LOGGER.warning("LLM call extract_tags using model=%s", state.model_name)
    time.sleep(random.uniform(1.5, 5.0))
    response, err = gemini_utils.prompt_with_multi_image_with_context(
        client, tag_prompt, [manual_ref], uploaded_images, state.model_name
    )
    #print(f"DEBUG gemini err: {err}, response is None: {response is None}")
    if err or response is None:
        state.error = f"Tag extraction failed: {err}"
        return state

    state.tags_json = response.text
    state.uploaded_images = uploaded_images
    state.comma_separated_image_names = comma_separated_image_names
    state.manual_ref = manual_ref
    return state


def generate_report(state: SurveyState) -> SurveyState:
    # TODO: refactor to use LangGraph OOTB client initialization
    # See GitHub issue — assigned to Rich
    if state.error:
        return state

    global _uploaded_sample_reports_cache, _uploaded_sample_report_names_cache, _template_tags_cache

    client = getLLMClient("google")

    # upload sample reports only if not already cached
    if not _uploaded_sample_reports_cache:
        _uploaded_sample_reports_cache, _uploaded_sample_report_names_cache = upload_sample_reports(
            client, state.sample_report_paths
        )

    # extract template tags only if not already cached
    if not _template_tags_cache:
        _template_tags_cache = extract_template_tags(state.report_template_path)

    uploaded_email_attachments, email_attachment_names = upload_report_attachments(
        client,
        state.email_attachments,
        "Email Attachment",
    )
    uploaded_bill_attachments, bill_attachment_names = upload_report_attachments(
        client,
        state.bill_attachments,
        "Bill Attachment",
    )
    prompt = structured_report_generation_prompt(
        template_tags=_template_tags_cache,
        tags_json=state.tags_json,
        sample_report_names=_uploaded_sample_report_names_cache,
        user_instruction=state.user_instruction,
        representing_party=state.representing_party,
        report_context=state.report_context,
        email_attachment_names=email_attachment_names,
        bill_attachment_names=bill_attachment_names,
    )
    context_files = [*uploaded_email_attachments, *uploaded_bill_attachments]

    LOGGER.warning("LLM call generate_report using model=%s", state.model_name)
    time.sleep(random.uniform(1.5, 5.0))
    response, err = gemini_utils.prompt_with_multi_image_with_context_with_samples(
        client,
        prompt,
        context_files,
        [],
        _uploaded_sample_reports_cache,
        state.model_name,
    )
    if err or response is None:
        state.error = f"Report generation failed: {err}"
        return state

    try:
        raw = response.text.strip().replace("```json", "").replace("```", "")
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            state.error = "Failed to parse report JSON: expected object"
            return state
        # Keep only known template tags and coerce all values to strings
        # so template replacement never fails on non-string types.
        filled_values = {
            tag: _to_template_text(parsed.get(tag))
            for tag in _template_tags_cache
        }
    except Exception as e:
        state.error = f"Failed to parse report JSON: {e}"
        return state

    doc_bytes = fill_template(state.report_template_path, filled_values, state.tags_json)
    state.generated_report_bytes = doc_bytes.read()
    state.generated_report = response.text
    return state

def evaluate_report(state: SurveyState) -> SurveyState:
    if state.error:
        return state

    client = getLLMClient("google")
    result = evaluate_reports(
        state.reference_report_text,
        state.generated_report,
        state.image_paths,
        client
    )
    state.evaluation_result = result
    return state


def persist_to_db(state: SurveyState) -> SurveyState:
    # TODO: add object storage persistence for generated report files
    logger = logging.getLogger(__name__)
    try:
        with PostgresConnectionPool().get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO agent_state (user_id, project_id, status, tags_json, generated_report, evaluation_result)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (project_id) DO UPDATE SET
                        tags_json = EXCLUDED.tags_json,
                        generated_report = EXCLUDED.generated_report,
                        evaluation_result = EXCLUDED.evaluation_result,
                        status = EXCLUDED.status,
                        updated_at = CURRENT_TIMESTAMP
                """, (
                    state.user_id,
                    state.project_id,
                    "completed" if state.generated_report else "tags_extracted",
                    state.tags_json,
                    state.generated_report,
                    state.evaluation_result,
                ))
                conn.commit()
    except Exception as e:
        logger.error(f"Failed to persist state to db: {e}")
    return state

def extract_tags_from_bytes(state: SurveyState) -> SurveyState:
    if state.error:
        return state

    global _uploaded_compliance_docs_cache, _compliance_doc_names_cache

    client = getLLMClient("google")

    # upload all compliance docs only if not already cached
    if not _uploaded_compliance_docs_cache:
        compliance_docs = glob.glob(
            os.path.join(state.compliance_docs_dir, "**/*.pdf"), recursive=True
        )
        for doc_path in compliance_docs:
            doc_name = os.path.splitext(os.path.basename(doc_path))[0]
            doc_ref, err = upload_with_retry(client, doc_path, doc_name)
            if err:
                LOGGER.warning(f"Skipping compliance doc {doc_name}: {err}")
                continue
            _uploaded_compliance_docs_cache.append(doc_ref)

        _compliance_doc_names_cache = ", ".join(
            [f"[Attached Reference Manual: {d.display_name}]" for d in _uploaded_compliance_docs_cache]
        )

    tag_prompt = multi_image_tag_extraction_prompt_tagged(
        _compliance_doc_names_cache,
        f"[Image Reference Name: {state.image_filename or state.image_mime_type}]",
    )

    LOGGER.warning("LLM call extract_tags_from_bytes using model=%s", state.model_name)
    time.sleep(random.uniform(1.5, 5.0))
    response, err = gemini_utils.prompt_with_image_bytes_with_context(
        client, tag_prompt, _uploaded_compliance_docs_cache, state.image_bytes, state.image_mime_type, state.model_name
    )
    if err or response is None:
        state.error = f"Tag extraction failed: {err}"
        return state

    state.tags_json = response.text
    return state
