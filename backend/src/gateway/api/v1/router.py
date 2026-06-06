from fastapi import APIRouter
from src.gateway.api.v1.routes import register_alpha_routes, register_health_routes
from src.gateway.api.v1.routes.extract_features import register_extract_features_routes
from src.gateway.api.v1.routes.dropbox import register_dropbox_routes
from src.gateway.api.v1.routes.evaluate_report import register_evaluate_report_routes
from src.gateway.api.v1.routes.generate_report import register_generate_report_routes
from src.gateway.api.v1.routes.embed_report_images import register_embed_report_images_routes
from src.gateway.api.v1.routes.autofill_metadata import register_autofill_metadata_routes
from src.gateway.types import ServerOpts


def get_v1_router(opts: ServerOpts) -> APIRouter:
    router = APIRouter(prefix="/v1")
    register_alpha_routes(router, opts)
    register_health_routes(router, opts)
    register_extract_features_routes(router, opts)
    register_dropbox_routes(router, opts)
    register_evaluate_report_routes(router, opts)
    register_generate_report_routes(router, opts)
    register_embed_report_images_routes(router, opts)
    register_autofill_metadata_routes(router, opts)
    return router
