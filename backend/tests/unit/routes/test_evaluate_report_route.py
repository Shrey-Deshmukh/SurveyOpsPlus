import pytest
import os
import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from src.main import app
from scripts.generate_graphs import generate_graphs


MOCK_EVAL_RESULT = {
    "total_score": 66,
    "max_score": 80,
    "summary": "The generated report covers key findings but has some omissions.",
    "categories": [
        {
            "name": "Image & Evidence Accuracy",
            "score": 12,
            "max_score": 16,
            "observations": "Container number correctly identified."
        },
        {
            "name": "Quantitative & Technical Accuracy",
            "score": 10,
            "max_score": 10,
            "observations": "All temperature conversions are accurate."
        }
    ]
}


@pytest.mark.unit
class TestEvaluateReportRoute:
    client = TestClient(app)

    @patch("src.gateway.api.v1.handlers.evaluate_report_handler.evaluate_reports")
    @patch("src.gateway.api.v1.handlers.evaluate_report_handler.getLLMClient")
    def test_evaluate_report_returns_200(self, mock_client, mock_evaluate):
        mock_evaluate.return_value = MOCK_EVAL_RESULT

        response = self.client.post(
            "/api/v1/evaluate-report",
            json={
                "reference_report": "This is the reference report text.",
                "generated_report": "This is the generated report text."
            }
        )

        assert response.status_code == 200

    @patch("src.gateway.api.v1.handlers.evaluate_report_handler.evaluate_reports")
    @patch("src.gateway.api.v1.handlers.evaluate_report_handler.getLLMClient")
    def test_evaluate_report_response_structure(self, mock_client, mock_evaluate):
        mock_evaluate.return_value = MOCK_EVAL_RESULT

        response = self.client.post(
            "/api/v1/evaluate-report",
            json={
                "reference_report": "Reference report text.",
                "generated_report": "Generated report text."
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "total_score" in data
        assert "max_score" in data
        assert "summary" in data
        assert "categories" in data
        assert isinstance(data["categories"], list)
        assert len(data["categories"]) > 0

    @patch("src.gateway.api.v1.handlers.evaluate_report_handler.evaluate_reports")
    @patch("src.gateway.api.v1.handlers.evaluate_report_handler.getLLMClient")
    def test_evaluate_report_category_structure(self, mock_client, mock_evaluate):
        mock_evaluate.return_value = MOCK_EVAL_RESULT

        response = self.client.post(
            "/api/v1/evaluate-report",
            json={
                "reference_report": "Reference report text.",
                "generated_report": "Generated report text."
            }
        )

        data = response.json()
        for category in data["categories"]:
            assert "name" in category
            assert "score" in category
            assert "max_score" in category
            assert "observations" in category
            assert isinstance(category["score"], int)
            assert isinstance(category["max_score"], int)

    @patch("src.gateway.api.v1.handlers.evaluate_report_handler.evaluate_reports")
    @patch("src.gateway.api.v1.handlers.evaluate_report_handler.getLLMClient")
    def test_evaluate_report_scores_are_valid(self, mock_client, mock_evaluate):
        mock_evaluate.return_value = MOCK_EVAL_RESULT

        response = self.client.post(
            "/api/v1/evaluate-report",
            json={
                "reference_report": "Reference report text.",
                "generated_report": "Generated report text."
            }
        )

        data = response.json()
        assert data["total_score"] <= data["max_score"]
        assert data["total_score"] >= 0

    @patch("src.gateway.api.v1.handlers.evaluate_report_handler.evaluate_reports")
    @patch("src.gateway.api.v1.handlers.evaluate_report_handler.getLLMClient")
    def test_evaluate_report_handles_llm_error(self, mock_client, mock_evaluate):
        mock_evaluate.side_effect = Exception("Gemini API error")

        response = self.client.post(
            "/api/v1/evaluate-report",
            json={
                "reference_report": "Reference report text.",
                "generated_report": "Generated report text."
            }
        )

        assert response.status_code == 500
        assert "error" in response.json()


@pytest.mark.unit
class TestGenerateGraphs:

    def test_generate_graphs_creates_files(self, tmp_path):
        output_path = str(tmp_path / "eval_graph.png")
        out1, out2 = generate_graphs(MOCK_EVAL_RESULT, output_path)

        assert os.path.exists(out1)
        assert os.path.exists(out2)

    def test_generate_graphs_returns_two_paths(self, tmp_path):
        output_path = str(tmp_path / "eval_graph.png")
        result = generate_graphs(MOCK_EVAL_RESULT, output_path)

        assert len(result) == 2
        assert result[0].endswith("_scores.png")
        assert result[1].endswith("_percent.png")

    def test_generate_graphs_scores_file_is_nonzero(self, tmp_path):
        output_path = str(tmp_path / "eval_graph.png")
        out1, out2 = generate_graphs(MOCK_EVAL_RESULT, output_path)

        assert os.path.getsize(out1) > 0
        assert os.path.getsize(out2) > 0