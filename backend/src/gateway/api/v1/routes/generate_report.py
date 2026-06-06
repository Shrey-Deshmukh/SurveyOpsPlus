import base64
import json
from fastapi import APIRouter, Request, Response, Query, HTTPException, UploadFile, File, Form
from src.gateway.api.v1.handlers.generate_report_handler import handle_generate_report
from src.gateway.types import ServerOpts


def _decode_generate_report_arg_data(arg_data: str) -> dict:
    try:
        decoded = json.loads(base64.b64decode(arg_data).decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid arg_data encoding")

    allowed_keys = {
        "project_id",
        "user_instruction",
        "representing_party",
        "report_context",
        "local_tags",
    }
    if not set(decoded.keys()).issubset(allowed_keys):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid parameters. Only project_id, user_instruction, "
                "representing_party, report_context, and local_tags are allowed."
            ),
        )

    if "project_id" not in decoded:
        raise HTTPException(status_code=400, detail="project_id is required")

    report_context = decoded.get("report_context")
    if report_context is not None and not isinstance(report_context, dict):
        raise HTTPException(status_code=400, detail="report_context must be an object")

    return decoded


def register_generate_report_routes(router: APIRouter, opts: ServerOpts):
    if opts.limiter:
        # accepts base64 encoded JSON with project_id, user_instruction, representing_party, report_context
        @router.get("/generate-report")
        @opts.limiter.limit("10/second")
        async def route_generate_report_get(
            request: Request,
            response: Response,
            arg_data: str = Query(...),
        ):
            decoded = _decode_generate_report_arg_data(arg_data)

            return await handle_generate_report(
                request,
                response,
                decoded["project_id"],
                decoded.get("user_instruction", ""),
                decoded.get("representing_party", ""),
                decoded.get("report_context"),
                [],
                [],
                decoded.get("local_tags"),
            )

        @router.post("/generate-report")
        @opts.limiter.limit("10/second")
        async def route_generate_report_post(
            request: Request,
            response: Response,
            arg_data: str = Form(...),
            email_attachments: list[UploadFile] | None = File(default=None),
            bill_attachments: list[UploadFile] | None = File(default=None),
        ):
            decoded = _decode_generate_report_arg_data(arg_data)
            return await handle_generate_report(
                request,
                response,
                decoded["project_id"],
                decoded.get("user_instruction", ""),
                decoded.get("representing_party", ""),
                decoded.get("report_context"),
                email_attachments or [],
                bill_attachments or [],
                decoded.get("local_tags"),
            )
