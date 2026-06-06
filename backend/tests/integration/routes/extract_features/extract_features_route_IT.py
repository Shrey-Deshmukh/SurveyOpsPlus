import pytest
import requests
import os
import json

TEST_IMAGE_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../../../assets/test_imgs/experiment1/image3.webp"
)

@pytest.mark.integration
class TestExtractFeaturesAPIIntegration:
    def test_extract_features_returns_200(self, docker_env):
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/extract-features"
        with open(TEST_IMAGE_PATH, "rb") as img:
            response = requests.post(
                endpoint,
                files=[("images", ("image3.webp", img, "image/webp"))],
            )
        assert response.status_code == 200

    def test_extract_features_response_structure(self, docker_env):
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/extract-features"
        with open(TEST_IMAGE_PATH, "rb") as img:
            response = requests.post(
                endpoint,
                files=[("images", ("image3.webp", img, "image/webp"))],
            )
        assert response.status_code == 200
        data = response.json()

        # top level keys
        assert "project_id" in data
        assert "results" in data
        assert len(data["results"]) == 1
        assert data["results"][0]["error"] is None

        tags_raw = data["results"][0]["tags"]
        tags = json.loads(tags_raw) if isinstance(tags_raw, str) else tags_raw
        assert isinstance(tags, list)
        assert len(tags) > 0

        # each item should have the expected POC structure
        for item in tags:
            assert "image_name" in item
            assert "tags" in item
            assert "location_desc" in item
            assert "manual_ref" in item
            assert "manual_ref_description" in item
            assert "internet_ref_links" in item
            assert "internet_ref_description" in item
            assert isinstance(item["tags"], list)

    def test_extract_features_tags_not_empty(self, docker_env):
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/extract-features"
        with open(TEST_IMAGE_PATH, "rb") as img:
            response = requests.post(
                endpoint,
                files=[("images", ("image3.webp", img, "image/webp"))],
            )
        assert response.status_code == 200
        data = response.json()
        tags_raw = data["results"][0]["tags"]
        tags = json.loads(tags_raw) if isinstance(tags_raw, str) else tags_raw

        # at least one tag entry with actual tags
        assert any(len(item["tags"]) > 0 for item in tags)

# This tells Pytest to reach into the fixture folder and load the module
pytest_plugins = ["tests.integration.fixture.docker_setup"]
