from fastapi import APIRouter, Request, Response
from pydantic import BaseModel
from src.gateway.api.v1.handlers.evaluate_report_handler import handle_evaluate_report
from src.gateway.types import ServerOpts


class EvaluateReportRequest(BaseModel):
    reference_report: str
    generated_report: str


def register_evaluate_report_routes(router: APIRouter, opts: ServerOpts):
    if opts.limiter:
        @router.post("/evaluate-report")
        @opts.limiter.limit("5/minute")
        async def route_evaluate_report(
            request: Request,
            response: Response,
            body: EvaluateReportRequest,
        ):
            return await handle_evaluate_report(request, response, body.reference_report, body.generated_report)