from google import genai
from utils.resolve_path import get_resolved_path


def upload_rubric(client: genai.Client):
    rubric_path = get_resolved_path(
        "assets/knowledge_base/evaluation_docs/LLM-Assisted_Insurance_and_Survey_Automation_Rubric.md"
    )
    rubric_file = client.files.upload(file=rubric_path)
    return rubric_file