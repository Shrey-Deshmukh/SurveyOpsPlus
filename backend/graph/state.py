# graph/state.py
from typing import Optional, Any
from dataclasses import dataclass, field
from utils.llm_client import resolve_google_model

@dataclass
class SurveyState:
    # Inputs
    user_id: str = ""
    project_id: str = ""
    model_name: str = field(default_factory=resolve_google_model)
    image_paths: list[str] = field(default_factory=list)
    manual_doc_path: str = ""
    manual_doc_name: str = ""
    report_template_path: str = ""
    report_template_name: str = ""
    sample_report_paths: list[str] = field(default_factory=list)
    reference_report_text: str = ""
    compliance_docs_dir: str = ""

    # Intermediate (passed between nodes)
    uploaded_images: list[Any] = field(default_factory=list)
    comma_separated_image_names: str = ""
    manual_ref: Optional[Any] = None
    tags_json: Optional[str] = None
    generated_report: Optional[str] = None

    # Eval
    evaluation_result: Optional[str] = None

    # Control
    run_evaluation: bool = False
    error: Optional[str] = None

    image_bytes: Optional[bytes] = None
    image_mime_type: str = ""
    generated_report_bytes: Optional[bytes] = None
    user_instruction: str = ""
    representing_party: str = ""
    image_filename: str = ""
    report_context: dict[str, Any] = field(default_factory=dict)
    email_attachments: list[dict[str, Any]] = field(default_factory=list)
    bill_attachments: list[dict[str, Any]] = field(default_factory=list)
