import pytest
from unittest.mock import MagicMock, patch
from psycopg2 import DatabaseError
from src.db.connection import PostgresConnectionPool

@pytest.mark.unit
class TestPostgresConnectionPool:
    def setup_method(self):
        """Reset the singleton before each test."""
        PostgresConnectionPool._instance = None

    def test_pool_initializes_with_env_credentials(self, monkeypatch):
        monkeypatch.setenv("DB_HOST", "localhost")
        monkeypatch.setenv("DB_PORT", "5432")
        monkeypatch.setenv("DB_NAME", "testdb")
        monkeypatch.setenv("DB_USER", "testuser")
        monkeypatch.setenv("DB_PASSWORD", "testpass")

        with patch("src.db.connection.pool.ThreadedConnectionPool") as mock_pool:
            from src.db.connection import PostgresConnectionPool
            PostgresConnectionPool()

            mock_pool.assert_called_once_with(
                minconn=1,
                maxconn=10,
                host="localhost",
                port=5432,
                dbname="testdb",
                user="testuser",
                password="testpass",
            )

    def test_raises_on_missing_env_var(self, monkeypatch):
        for var in ("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"):
            monkeypatch.delenv(var, raising=False)

        with patch("src.db.connection.pool.ThreadedConnectionPool", side_effect=KeyError("DB_HOST")):
            from src.db.connection import PostgresConnectionPool
            with pytest.raises(KeyError):
                PostgresConnectionPool()

    def test_raises_on_db_error(self, monkeypatch):
        monkeypatch.setenv("DB_HOST", "localhost")
        monkeypatch.setenv("DB_NAME", "testdb")
        monkeypatch.setenv("DB_USER", "testuser")
        monkeypatch.setenv("DB_PASSWORD", "testpass")

        with patch("src.db.connection.pool.ThreadedConnectionPool", side_effect=DatabaseError("connection refused")):
            from src.db.connection import PostgresConnectionPool
            with pytest.raises(DatabaseError):
                PostgresConnectionPool()