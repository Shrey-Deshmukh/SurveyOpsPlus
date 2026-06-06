import pytest
import requests


@pytest.mark.integration
class TestAlphaAPIIntegration:
    def test_alpha_endpoint(self, docker_env):
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/alpha"

        r1 = requests.get(endpoint)
        r2 = requests.get(endpoint)

        assert r1.status_code == 200
        assert r2.status_code == 200

        r1_data = r1.json()
        r2_data = r2.json()

        assert r1_data["service"] == "Alpha v1"
        assert r1_data["service"] == r2_data["service"]
        assert "client_ip" in r1_data and "client_ip" in r2_data

    def test_alpha_rate_limit(self, docker_env):
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/alpha"

        # Fire 5 successful requests against the live container
        for i in range(6):
            response = requests.get(endpoint)
            print(f"Request {i}: Status {response.status_code}")
            if i == 5:  # The 6th request
                assert response.status_code == 429, (
                    f"Expected 429, got {response.status_code}. Content: {response.text}"
                )
                assert "Rate limit exceeded" in response.text
