from fastapi import APIRouter, Request, Response

from src.gateway.api.v1.handlers.embed_report_images_handler import (
    EmbedReportImagesBody,
    handle_embed_report_images,
)
from src.gateway.types import ServerOpts


def register_embed_report_images_routes(router: APIRouter, opts: ServerOpts):
    if opts.limiter:

        @router.post("/embed-report-images")
        @opts.limiter.limit("10/second")
        async def route_embed_report_images(
            request: Request,
            response: Response,
            body: EmbedReportImagesBody,
        ):
            return handle_embed_report_images(body)
