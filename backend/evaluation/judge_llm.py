import json
import logging
from google import genai
from .rubric_loader import upload_rubric
from llm.gemini.utils import prompt_with_multi_image_with_context
from llm.prompts.prompts import evaluate_reports_prompt
from utils.llm_client import resolve_google_model

LOGGER = logging.getLogger(__name__)


def evaluate_reports(
    reference_report: str,
    generated_report: str,
    client: genai.Client,
) -> dict:
    rubric_file = upload_rubric(client)
    prompt = evaluate_reports_prompt(reference_report, generated_report)

    model_name = resolve_google_model()
    LOGGER.warning("LLM call evaluate_reports using model=%s", model_name)
    response, error = prompt_with_multi_image_with_context(
        client=client,
        prompt=prompt,
        context_files=[rubric_file],
        image_files=[],
        model_name=model_name
    )

    if error:
        raise Exception(error)

    raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)