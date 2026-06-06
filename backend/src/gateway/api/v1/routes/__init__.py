from .alpha import register_alpha_routes
from .health import register_health_routes
from .extract_features import register_extract_features_routes
from .dropbox import register_dropbox_routes
from .generate_report import register_generate_report_routes
from .embed_report_images import register_embed_report_images_routes
from .autofill_metadata import register_autofill_metadata_routes

__all__ = [
    "register_alpha_routes",
    "register_health_routes",
    "register_extract_features_routes",
    "register_dropbox_routes",
    "register_generate_report_routes",
    "register_embed_report_images_routes",
    "register_autofill_metadata_routes",
]
