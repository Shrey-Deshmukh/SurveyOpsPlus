import io
import os
import uuid

import psycopg2
import pytest
import requests


@pytest.mark.integration
class TestDropboxAPIIntegration:

    def test_dropbox_connect_returns_authorization_url(self, docker_env):
        """
        Verifies the /dropbox/connect endpoint returns a valid Dropbox authorization URL.
        """
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/dropbox/connect"

        response = requests.get(endpoint)

        assert response.status_code == 200
        data = response.json()
        assert "authorization_url" in data
        assert "state" in data
        assert "dropbox.com/oauth2/authorize" in data["authorization_url"]

    def test_dropbox_upload_and_verify(self, docker_env):
        """
        Uses a long-lived refresh token to:
        1. Seed the DB with a test user and tokens
        2. Upload a file to Dropbox
        3. Verify the file exists and has the correct size
        4. Clean up DB records and Dropbox file
        """
        refresh_token = os.environ.get("DROPBOX_TEST_REFRESH_TOKEN")
        app_key = os.environ.get("DROPBOX_APP_KEY")
        app_secret = os.environ.get("DROPBOX_APP_SECRET")

        if not refresh_token or not app_key or not app_secret:
            pytest.fail(
                "DROPBOX_TEST_REFRESH_TOKEN, DROPBOX_APP_KEY, or DROPBOX_APP_SECRET "
                "not set — these are required for the Dropbox upload integration test"
            )

        test_user_id = str(uuid.uuid4())
        test_email = f"test_{test_user_id}@dropbox.placeholder"
        test_account_id = "test_account"
        dropbox_path = None

        # Use a placeholder access token — the server will auto-refresh it on 401
        # using the valid refresh token
        access_token = "placeholder_will_be_refreshed"

        try:
            # Step 1 — seed a test user and tokens directly into the DB
            conn = psycopg2.connect(
                host=docker_env["db_host"],
                port=docker_env["db_port"],
                dbname=docker_env["db_name"],
                user=docker_env["db_user"],
                password=docker_env["db_password"],
            )
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO users (id, email) VALUES (%s, %s);",
                        (test_user_id, test_email),
                    )
                    cur.execute(
                        """
                        INSERT INTO dropbox_tokens (user_id, account_id, access_token, refresh_token)
                        VALUES (%s, %s, pgp_sym_encrypt(%s, %s), pgp_sym_encrypt(%s, %s));
                        """,
                        (test_user_id, test_account_id, access_token, os.environ["DB_ENCRYPTION_KEY"], refresh_token, os.environ["DB_ENCRYPTION_KEY"]),
                    )
            conn.close()

            # Step 2 — upload a test file via the API
            server_url = docker_env["server_url"]
            endpoint = f"{server_url}/api/v1/dropbox/upload"

            file_content = b"SurveyOps integration test file content"
            test_file = io.BytesIO(file_content)

            response = requests.post(
                endpoint,
                params={"user_id": test_user_id, "project_id": "test-project-123"},
                files={"file": ("test_upload.txt", test_file, "text/plain")},
            )

            assert response.status_code == 201, f"Upload failed: {response.text}"
            data = response.json()
            assert data["message"] == "File uploaded successfully"
            assert data["dropbox_path"] is not None
            assert data["file_id"] is not None

            dropbox_path = data["dropbox_path"]

            # Step 3 — get a fresh token to verify file metadata
            token_resp = requests.post(
                "https://api.dropboxapi.com/oauth2/token",
                data={"grant_type": "refresh_token", "refresh_token": refresh_token},
                auth=(app_key, app_secret),
            )
            assert token_resp.status_code == 200, f"Failed to refresh token: {token_resp.text}"
            verify_token = token_resp.json()["access_token"]

            # Step 4 — verify file size via Dropbox API directly
            file_id = data["file_id"]
            metadata_resp = requests.post(
                "https://api.dropboxapi.com/2/files/get_metadata",
                headers={
                    "Authorization": f"Bearer {verify_token}",
                    "Content-Type": "application/json",
                },
                json={"path": file_id},
            )
            assert metadata_resp.status_code == 200, f"Metadata fetch failed: {metadata_resp.text}"
            metadata = metadata_resp.json()
            assert metadata["size"] == len(file_content), (
                f"File size mismatch: expected {len(file_content)}, got {metadata['size']}"
            )

        finally:
            # Cleanup — delete DB records
            try:
                conn = psycopg2.connect(
                    host=docker_env["db_host"],
                    port=docker_env["db_port"],
                    dbname=docker_env["db_name"],
                    user=docker_env["db_user"],
                    password=docker_env["db_password"],
                )
                with conn:
                    with conn.cursor() as cur:
                        cur.execute("DELETE FROM dropbox_tokens WHERE user_id = %s;", (test_user_id,))
                        cur.execute("DELETE FROM users WHERE id = %s;", (test_user_id,))
                conn.close()
            except Exception as e:
                print(f"DB cleanup failed: {e}")

            # Cleanup — delete file from Dropbox
            if dropbox_path:
                try:
                    token_resp = requests.post(
                        "https://api.dropboxapi.com/oauth2/token",
                        data={"grant_type": "refresh_token", "refresh_token": refresh_token},
                        auth=(app_key, app_secret),
                    )
                    if token_resp.status_code == 200:
                        cleanup_token = token_resp.json()["access_token"]
                        requests.post(
                            "https://api.dropboxapi.com/2/files/delete_v2",
                            headers={
                                "Authorization": f"Bearer {cleanup_token}",
                                "Content-Type": "application/json",
                            },
                            json={"path": dropbox_path},
                        )
                except Exception as e:
                    print(f"Dropbox cleanup failed: {e}")

    def test_dropbox_upload_without_tokens_returns_404(self, docker_env):
        """
        Verifies that uploading without a connected Dropbox account returns 404.
        """
        server_url = docker_env["server_url"]
        endpoint = f"{server_url}/api/v1/dropbox/upload"

        file_content = b"test content"
        test_file = io.BytesIO(file_content)

        response = requests.post(
            endpoint,
            params={"user_id": str(uuid.uuid4()), "project_id": "proj-000"},
            files={"file": ("test.txt", test_file, "text/plain")},
        )

        assert response.status_code == 404