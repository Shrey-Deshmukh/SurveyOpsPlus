from contextlib import asynccontextmanager
from fastapi.testclient import TestClient
from slowapi.util import get_remote_address
from slowapi import Limiter
from src.main import app
from src.gateway.types import ServerOpts
from src.gateway import get_server_with_opts
import pytest


@asynccontextmanager
async def dummy_lifespan(app):
    yield


@pytest.mark.unit
class TestAlphaAPIRoute:
    client = TestClient(app)

    def test_alpha_endpoint(self):
        r1 = self.client.get("/api/v1/alpha")
        r2 = self.client.get("/api/v1/alpha")

        r1_data = r1.json()
        r2_data = r2.json()

        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1_data["service"] == "Alpha v1"
        assert r1_data["service"] == r2_data["service"]
        assert "client_ip" in r1_data and "client_ip" in r2_data

    @pytest.mark.unit
    def test_alpha_rate_limit_di(self, mocker):
        test_limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
        mock_opts = ServerOpts(limiter=test_limiter, lifespan=dummy_lifespan)
        mock_app = get_server_with_opts(mock_opts)

        client = TestClient(mock_app)

        for _ in range(5):
            response = client.get("/api/v1/alpha")
            assert response.status_code == 200

        blocked_response = client.get("/api/v1/alpha")

        assert blocked_response.status_code == 429
        assert "Rate limit exceeded" in blocked_response.text