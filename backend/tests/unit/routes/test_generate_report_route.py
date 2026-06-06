import pytest
import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from src.main import app
from src.gateway.api.v1.handlers.generate_report_handler import _sync_local_tags_with_db

@pytest.mark.unit
class TestGenerateReportRouteUnit:
    client = TestClient(app)

    @patch("src.gateway.api.v1.handlers.generate_report_handler._load_tags_from_db")
    @patch("src.gateway.api.v1.handlers.generate_report_handler.PostgresConnectionPool")
    def test_sync_local_tags_merging(self, mock_pool, mock_load):
        # Setup mocks
        existing_tags = [
            {
                "image_name": "image1.jpg",
                "tags": ["corrosion"],
                "location_desc": "top right",
                "manual_ref": ["page 5"],
                "manual_ref_description": ["rule 1"],
                "internet_ref_links": [],
                "internet_ref_description": ""
            }
        ]
        mock_load.return_value = json.dumps(existing_tags)

        # Mock database connection
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_pool.return_value.get_connection.return_value.__enter__.return_value = mock_conn

        # Test local_tags payload
        local_tags = [
            {
                "image_name": "image1.jpg",
                "tags": ["corrosion", "needs attention"]
            },
            {
                "image_name": "image2.jpg",
                "tags": ["clean"]
            }
        ]

        result_json = _sync_local_tags_with_db("proj_123", local_tags)
        assert result_json is not None

        result_list = json.loads(result_json)
        assert len(result_list) == 2

        # Verify image1 updated its tags but kept other properties
        img1 = next(item for item in result_list if item["image_name"] == "image1.jpg")
        assert img1["tags"] == ["corrosion", "needs attention"]
        assert img1["location_desc"] == "top right"
        assert img1["manual_ref"] == ["page 5"]

        # Verify image2 created with empty placeholder fields
        img2 = next(item for item in result_list if item["image_name"] == "image2.jpg")
        assert img2["tags"] == ["clean"]
        assert img2["location_desc"] == ""
        assert img2["manual_ref"] == []

        # Verify DB execute was called
        mock_cursor.execute.assert_called_once()
        args = mock_cursor.execute.call_args[0]
        assert "INSERT INTO agent_state" in args[0]
        assert args[1][1] == "proj_123"
        assert "clean" in args[1][3]
