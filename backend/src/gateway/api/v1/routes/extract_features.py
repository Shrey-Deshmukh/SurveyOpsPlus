from fastapi import APIRouter, Request, Response, UploadFile, File, Form
from src.gateway.api.v1.handlers import handle_extract_features
from src.gateway.types import ServerOpts


def register_extract_features_routes(router: APIRouter, opts: ServerOpts):
    # if opts.limiter:
    #     @opts.limiter.limit("10/second")
    @router.post("/extract-features")
    async def route_extract_features(
        request: Request,
        response: Response,
        images: list[UploadFile] = File(...),
        project_id: str | None = Form(default=None),
    ):
        return await handle_extract_features(
            response=response,
            image_batch=images,
            project_id=project_id,
        )
