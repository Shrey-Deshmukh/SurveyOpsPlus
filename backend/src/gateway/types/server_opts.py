from dataclasses import dataclass
from typing import Callable
from slowapi import Limiter


@dataclass
class ServerOpts:
    limiter: Limiter
    lifespan: Callable