from fastapi import Request, Response, status


async def handle_service_alpha(request: Request, response: Response) -> dict:
    client_ip = "Unknown"
    if request.client:
        client_ip = request.client.host

    response.status_code = status.HTTP_200_OK
    return {
        "service": "Alpha v1",
        "client_ip": client_ip,
    }
