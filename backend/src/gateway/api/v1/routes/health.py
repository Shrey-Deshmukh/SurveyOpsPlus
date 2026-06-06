from fastapi import APIRouter, Request, Response
from src.gateway.api.v1.handlers import handle_service_health
from src.gateway.types import ServerOpts


def register_health_routes(router: APIRouter, opts: ServerOpts):

    if opts.limiter:

        @router.get("/health")
        @opts.limiter.limit("5/minute")
        async def route_service_health(request: Request, response: Response):
            return await handle_service_health(request, response)
