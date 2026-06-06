from fastapi import FastAPI, APIRouter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from src.gateway.types import ServerOpts
from src.gateway.api.v1 import get_v1_router


def get_server_with_opts(opts: ServerOpts) -> FastAPI:
    app = FastAPI(title="survey-ops-plus FastAPI API Gateway", lifespan=opts.lifespan)

    if opts.limiter:
        app.state.limiter = opts.limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    api_router = APIRouter(prefix="/api")
    api_router.include_router(get_v1_router(opts))

    app.include_router(api_router)

    return app
