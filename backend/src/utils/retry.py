import random
import time
import logging

logger = logging.getLogger(__name__)


def retry_with_backoff(fn, max_retries: int = 5, base_delay: float = 1.0):
    """
    Calls fn() up to max_retries times with exponential backoff and full jitter.
    Logs each retry attempt. Raises the last exception if all retries fail.
    Full jitter: random.uniform(0, delay) to avoid thundering herd.
    """
    last_exception = None

    for attempt in range(1, max_retries + 1):
        try:
            return fn()
        except Exception as e:
            last_exception = e
            delay = base_delay * (2 ** (attempt - 1))
            jitter = random.uniform(0, delay)
            logger.warning(
                f"Retry attempt {attempt}/{max_retries} failed: {e}. "
                f"Retrying in {jitter:.2f}s..."
            )
            time.sleep(jitter)

    logger.error(f"All {max_retries} retry attempts failed.")
    raise last_exception