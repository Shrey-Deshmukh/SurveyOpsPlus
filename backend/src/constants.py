import os

TEMP_UPLOAD_DIR = "/tmp/survey_uploads"

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


COMPLIANCE_DOCS_DIR = os.path.join(
    BACKEND_ROOT,
    "assets/knowledge_base/compliance_docs",
)

# kept for backwards compat but no longer used directly
MANUAL_DOC_PATH = os.path.join(COMPLIANCE_DOCS_DIR, "Cargo-Advice-Refrigerated-cargoes.pdf")
MANUAL_DOC_NAME = "refrigerated_cargo_doc"

ALLOWED_IMAGE_TYPES = {
    "image/webp",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/heic",
    "image/heif",
}

# Max images per /extract-features request (aligned with frontend batch size).
EXTRACT_FEATURES_MAX_BATCH_SIZE = 10
