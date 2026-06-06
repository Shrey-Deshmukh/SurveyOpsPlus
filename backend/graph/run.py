# graph/run.py — called by your API Gateway
from dotenv import load_dotenv
load_dotenv()

from graph.graph import build_extract_features_graph, build_generate_report_graph, build_extract_features_from_bytes_graph
from graph.state import SurveyState
from utils.llm_client import resolve_google_model
from src.constants import COMPLIANCE_DOCS_DIR

def run_generate_report_pipeline(
    project_id: str,
    tags_json: str,
    user_id: str = "test_user",
    model_name: str = resolve_google_model(),
    report_template_path: str = "",
    report_template_name: str = "",
    sample_report_paths: list = [],
    run_evaluation: bool = False,
    user_instruction: str = "",
    representing_party: str = "",
    report_context: dict | None = None,
    email_attachments: list[dict] | None = None,
    bill_attachments: list[dict] | None = None,
) -> SurveyState:
    graph = build_generate_report_graph()
    initial_state = SurveyState(
        user_id=user_id,
        project_id=project_id,
        model_name=model_name,
        tags_json=tags_json,
        report_template_path=report_template_path,
        report_template_name=report_template_name,
        sample_report_paths=sample_report_paths,
        run_evaluation=run_evaluation,
        user_instruction=user_instruction,
        representing_party=representing_party,
        report_context=report_context or {},
        email_attachments=email_attachments or [],
        bill_attachments=bill_attachments or [],
    )
    return graph.invoke(initial_state)


def run_extract_features_pipeline_from_bytes(
    user_id: str,
    project_id: str,
    image_bytes: bytes,
    image_mime_type: str,
    image_filename: str = "",
    model_name: str = resolve_google_model(),
    manual_doc_path: str = "",
    manual_doc_name: str = "",
    compliance_docs_dir: str = COMPLIANCE_DOCS_DIR
) -> SurveyState:
    graph = build_extract_features_from_bytes_graph()
    initial_state = SurveyState(
        user_id=user_id,
        project_id=project_id,
        model_name=model_name,
        image_bytes=image_bytes,
        image_mime_type=image_mime_type,
        image_filename=image_filename,
        manual_doc_path=manual_doc_path,
        manual_doc_name=manual_doc_name,
        compliance_docs_dir=compliance_docs_dir,
    )
    return graph.invoke(initial_state)



if __name__ == "__main__":
    import os

    img_folder = "assets/test_imgs/experiment1"
    image_paths = [
        os.path.join(img_folder, f)
        for f in os.listdir(img_folder)
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
    ]

    sample_reports_folder = "assets/knowledge_base/sample_reports"
    sample_report_paths = [
        os.path.join(sample_reports_folder, f)
        for f in os.listdir(sample_reports_folder)
        if f.lower().endswith((".pdf", ".md"))
    ]

    print("\n=== Step 1: Extracting Features ===\n")
    extract_result = run_extract_features_pipeline(
        user_id="test_user",
        project_id="test_project",
        image_paths=image_paths,
        manual_doc_path="assets/knowledge_base/compliance_docs/Cargo-Advice-Refrigerated-cargoes.pdf",
        manual_doc_name="refrigerated_cargo_doc",
    )
    print(f"Tags extracted: {extract_result['tags_json'] is not None}")
    print(f"Error: {extract_result['error']}")

    print("\n=== Step 2: Generating Report ===\n")
    report_result = run_generate_report_pipeline(
        project_id="test_project",
        tags_json=extract_result['tags_json'],
        report_template_path="assets/knowledge_base/report_templates/template1.pdf",
        report_template_name="report_template_1_doc",
        sample_report_paths=sample_report_paths,
    )
    print(f"Report generated: {report_result['generated_report'] is not None}")
    print(f"Error: {report_result['error']}")
