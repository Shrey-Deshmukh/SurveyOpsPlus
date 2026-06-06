from fastapi import APIRouter, File, Request, Response, UploadFile

from src.gateway.api.v1.handlers.autofill_metadata_handler import (
    handle_autofill_metadata,
)
from src.gateway.types import ServerOpts


def register_autofill_metadata_routes(router: APIRouter, opts: ServerOpts):
    if opts.limiter:
        @router.post("/autofill-metadata")
        @opts.limiter.limit("10/second")
        async def route_autofill_metadata(
            request: Request,
            response: Response,
            email_attachments: list[UploadFile] | None = File(default=None),
            bill_attachments: list[UploadFile] | None = File(default=None),
        ):
            return await handle_autofill_metadata(
                email_attachments=email_attachments or [],
                bill_attachments=bill_attachments or [],
            )
    else:
        @router.post("/autofill-metadata")
        async def route_autofill_metadata(
            request: Request,
            response: Response,
            email_attachments: list[UploadFile] | None = File(default=None),
            bill_attachments: list[UploadFile] | None = File(default=None),
        ):
            return await handle_autofill_metadata(
                email_attachments=email_attachments or [],
                bill_attachments=bill_attachments or [],
            )
