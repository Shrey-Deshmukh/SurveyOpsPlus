from fastapi import Request, Response, status
from utils.llm_client import getLLMClient
from evaluation.judge_llm import evaluate_reports


async def handle_evaluate_report(request: Request, response: Response, reference_report: str, generated_report: str) -> dict:
    if not reference_report or not generated_report:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "reference_report and generated_report are required"}

    try:
        client = getLLMClient("google")
        result = evaluate_reports(reference_report, generated_report, client)
        response.status_code = status.HTTP_200_OK
        return result
    except Exception as e:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"error": str(e)}