from fastapi import APIRouter, Request, Response
from src.gateway.api.v1.handlers import handle_service_alpha
from src.gateway.types import ServerOpts


def register_alpha_routes(router: APIRouter, opts: ServerOpts):

    if opts.limiter:

        @router.get("/alpha")
        @opts.limiter.limit("5/minute")
        async def route_service_alpha(request: Request, response: Response):
            return await handle_service_alpha(request, response)
