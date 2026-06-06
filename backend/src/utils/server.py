from src.gateway.types import ServerOpts
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Callable


def build_options(lifespan: Callable) -> ServerOpts:
    """
    Central place to construct all runtime options.
    This can later pull from env, config files, etc.
    """
    limiter = Limiter(key_func=get_remote_address)
    return ServerOpts(limiter=limiter, lifespan=lifespan)
