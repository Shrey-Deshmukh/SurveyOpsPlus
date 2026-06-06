import os
import logging
import threading
from contextlib import contextmanager
from typing import Generator
from psycopg2 import pool, DatabaseError
from psycopg2.extensions import connection as PgConnection
from src.utils.retry import retry_with_backoff

# TODO: move to class-level logger with lazy loading
logger = logging.getLogger(__name__)

class PostgresConnectionPool:
    """
    A thread-safe Singleton class for managing a PostgreSQL connection pool.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialize_pool()
        return cls._instance

    def _initialize_pool(self):
        """Initializes the connection pool using environment variables."""
        min_conn = int(os.environ.get("DB_MIN_CONN", 1))
        max_conn = int(os.environ.get("DB_MAX_CONN", 10))

        try:
            logger.info(f"Initializing PostgreSQL ThreadedConnectionPool (Min: {min_conn}, Max: {max_conn})")
            self._pool = pool.ThreadedConnectionPool(
                minconn=min_conn,
                maxconn=max_conn,
                host=os.environ["DB_HOST"],
                port=int(os.environ.get("DB_PORT", 5432)),
                dbname=os.environ["DB_NAME"],
                user=os.environ["DB_USER"],
                password=os.environ["DB_PASSWORD"],
            )
        except DatabaseError as e:
            logger.error(f"Failed to initialize database connection pool: {e}")
            raise

    def verify_connection(self):
        """
        Verifies DB connectivity on startup with retries, exponential backoff and jitter.
        Fails fast if the DB is unreachable after max retries.
        """
        def _check():
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1;")
            logger.info("Database connectivity verified successfully.")

        retry_with_backoff(_check)

    @contextmanager
    def get_connection(self) -> Generator[PgConnection, None, None]:
        """
        Yields a connection from the pool.
        Automatically returns it to the pool when the context exits.
        """
        conn = self._pool.getconn()
        try:
            yield conn
        finally:
            self._pool.putconn(conn)

    def close_all(self):
        """Closes all connections. Call during application shutdown."""
        if self._pool:
            logger.info("Closing all database connections in the pool.")
            self._pool.closeall()