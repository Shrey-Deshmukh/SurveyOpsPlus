import base64
import json
import os
from io import BytesIO

import psycopg2
import pytest
import requests
from docx import Document

TEST_IMAGE_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../../../../assets/test_imgs/experiment1/image3.webp"
)


def _encode_generate_report_arg_data(
    project_id: str,
    *,
    local_tags: list[dict] | None = None,
) -> str:
    payload = {
        "project_id": project_id,
        "user_instruction": "",
        "representing_party": "",
    }
    if local_tags is not None:
        payload["local_tags"] = local_tags
    return base64.b64encode(json.dumps(payload).encode("utf-8")).decode("ascii")


@pytest.mark.integration
class TestGenerateReportAPIIntegration:

    def _extract_and_get_project_id(self, server_url: str) -> str:
        """Helper to run extract-features and return project_id."""
        endpoint = f"{server_url}/api/v1/extract-features"
        with open(TEST_IMAGE_PATH, "rb") as img:
            response = requests.post(
                endpoint,
                files=[("images", ("image3.webp", img, "image/webp"))],
            )
        assert response.status_code == 200
        return response.json()["project_id"]

    def _generate_report(self, server_url: str, project_id: str, **kwargs):
        endpoint = f"{server_url}/api/v1/generate-report"
        arg_data = _encode_generate_report_arg_data(project_id, **kwargs)
        return requests.get(endpoint, params={"arg_data": arg_data})

    def test_generate_report_returns_200(self, docker_env):
        server_url = docker_env["server_url"]
        project_id = self._extract_and_get_project_id(server_url)

        response = self._generate_report(server_url, project_id)

        assert response.status_code == 200

    def test_generate_report_returns_docx(self, docker_env):
        server_url = docker_env["server_url"]
        project_id = self._extract_and_get_project_id(server_url)

        response = self._generate_report(server_url, project_id)

        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    def test_generate_report_filename_contains_project_id(self, docker_env):
        server_url = docker_env["server_url"]
        project_id = self._extract_and_get_project_id(server_url)

        response = self._generate_report(server_url, project_id)

        assert response.status_code == 200
        content_disposition = response.headers.get("content-disposition", "")
        assert project_id in content_disposition

    def test_generate_report_invalid_project_id_returns_404(self, docker_env):
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/generate-report"
        arg_data = _encode_generate_report_arg_data("non-existent-project-id")
        response = requests.get(endpoint, params={"arg_data": arg_data})

        assert response.status_code == 404

    def test_generate_report_file_is_valid_docx(self, docker_env):
        server_url = docker_env["server_url"]
        project_id = self._extract_and_get_project_id(server_url)

        response = self._generate_report(server_url, project_id)

        assert response.status_code == 200
        # docx files start with PK (zip magic bytes)
        assert response.content[:2] == b'PK'

    def test_generate_report_surveyor_findings_filled(self, docker_env):
        server_url = docker_env["server_url"]
        project_id = self._extract_and_get_project_id(server_url)

        response = self._generate_report(server_url, project_id)

        assert response.status_code == 200

        # parse the docx and check surveyor findings section is filled
        doc = Document(BytesIO(response.content))
        full_text = "\n".join([para.text for para in doc.paragraphs])

        # template placeholder should be replaced
        assert "<surveyor_findings>" not in full_text

        # surveyor findings section should have actual content after the header
        lines = full_text.split("\n")
        findings_idx = next((i for i, l in enumerate(lines) if "SURVEYOR'S FINDINGS" in l), None)
        assert findings_idx is not None

        # there should be non-empty content after the findings header
        content_after_findings = [l for l in lines[findings_idx+1:] if l.strip()]
        assert len(content_after_findings) > 0

    def test_generate_report_syncs_local_tags_to_db(self, docker_env):
        server_url = docker_env["server_url"]
        project_id = self._extract_and_get_project_id(server_url)

        synced_tags = ["integration-sync-tag-a", "integration-sync-tag-b"]
        response = self._generate_report(
            server_url,
            project_id,
            local_tags=[
                {
                    "image_name": "image3.webp",
                    "tags": synced_tags,
                }
            ],
        )
        assert response.status_code == 200

        with psycopg2.connect(
            host=docker_env["db_host"],
            port=docker_env["db_port"],
            dbname=docker_env["db_name"],
            user=docker_env["db_user"],
            password=docker_env["db_password"],
        ) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT tags_json FROM agent_state WHERE project_id = %s",
                    (project_id,),
                )
                row = cur.fetchone()

        assert row is not None
        tags_list = json.loads(row[0])
        image_entry = next(
            item for item in tags_list if item.get("image_name") == "image3.webp"
        )
        assert image_entry["tags"] == synced_tags
