import pytest
import requests


@pytest.mark.integration
class TestEvaluateReportAPIIntegration:

    def test_evaluate_report_returns_200(self, docker_env):
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/evaluate-report"

        response = requests.post(
            endpoint,
            json={
                "reference_report": "Reference report text for testing.",
                "generated_report": "Generated report text for testing."
            },
            timeout=300
        )

        assert response.status_code == 200

    def test_evaluate_report_response_structure(self, docker_env):
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/evaluate-report"

        response = requests.post(
            endpoint,
            json={
                "reference_report": "Reference report text for testing.",
                "generated_report": "Generated report text for testing."
            },
            timeout=300
        )

        assert response.status_code == 200
        data = response.json()

        assert "total_score" in data
        assert "max_score" in data
        assert "summary" in data
        assert "categories" in data
        assert isinstance(data["categories"], list)
        assert len(data["categories"]) > 0

    def test_evaluate_report_category_structure(self, docker_env):
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/evaluate-report"

        response = requests.post(
            endpoint,
            json={
                "reference_report": "Reference report text for testing.",
                "generated_report": "Generated report text for testing."
            },
            timeout=300
        )

        assert response.status_code == 200
        data = response.json()

        for category in data["categories"]:
            assert "name" in category
            assert "score" in category
            assert "max_score" in category
            assert "observations" in category
            assert isinstance(category["score"], int)
            assert isinstance(category["max_score"], int)
            assert category["score"] <= category["max_score"]

    def test_evaluate_report_total_score_valid(self, docker_env):
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/evaluate-report"

        response = requests.post(
            endpoint,
            json={
                "reference_report": "Reference report text for testing.",
                "generated_report": "Generated report text for testing."
            },
            timeout=300
        )

        assert response.status_code == 200
        data = response.json()

        assert data["total_score"] >= 0
        assert data["total_score"] <= data["max_score"]