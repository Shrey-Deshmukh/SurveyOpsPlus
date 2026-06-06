import logging
import os
import secrets
from fastapi import Request, Response, UploadFile, HTTPException, status
from src.services.storage.dropbox_service import DropboxService
from src.db import PostgresConnectionPool
from src.services.utils import build_dropbox_image_path

logger = logging.getLogger(__name__)


def _get_encryption_key() -> str:
    key = os.environ.get("DB_ENCRYPTION_KEY")
    if not key:
        raise RuntimeError("DB_ENCRYPTION_KEY environment variable is not set")
    return key


async def handle_dropbox_connect(request: Request, response: Response) -> dict:
    """Generates and returns the Dropbox authorization URL."""
    state = secrets.token_urlsafe(16)
    # TODO: persist state in DB or cache tied to session for CSRF validation
    auth_url = DropboxService().get_authorization_url(state=state)
    response.status_code = status.HTTP_200_OK
    return {"authorization_url": auth_url, "state": state}


async def handle_dropbox_callback(
    request: Request,
    response: Response,
    code: str,
    state: str,
) -> dict:
    """
    Called by Dropbox after the user authorizes the app.
    Exchanges the code for tokens and persists them encrypted to the DB.

    TODO: Validate `state` against what was stored in DB/cache (CSRF check)
    TODO: Associate tokens with the logged-in surveyor's user_id instead of creating a new user
    """
    try:
        encryption_key = _get_encryption_key()
        service = DropboxService()
        tokens = service.exchange_code_for_tokens(code)

        with PostgresConnectionPool().get_connection() as conn:
            with conn.cursor() as cur:
                # Create a placeholder user if one doesn't exist yet
                # TODO: replace with actual user_id from auth session
                cur.execute("""
                    INSERT INTO users (email)
                    VALUES (%s)
                    ON CONFLICT (email) DO NOTHING
                    RETURNING id;
                """, (f"{tokens.account_id}@dropbox.placeholder",))

                row = cur.fetchone()
                if row is None:
                    cur.execute("SELECT id FROM users WHERE email = %s;",
                                (f"{tokens.account_id}@dropbox.placeholder",))
                    row = cur.fetchone()

                user_id = row[0]

                # Upsert Dropbox tokens — encrypted with pgp_sym_encrypt
                cur.execute("""
                    INSERT INTO dropbox_tokens (user_id, account_id, access_token, refresh_token)
                    VALUES (
                        %s,
                        %s,
                        pgp_sym_encrypt(%s, %s),
                        pgp_sym_encrypt(%s, %s)
                    )
                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        account_id = EXCLUDED.account_id,
                        access_token = EXCLUDED.access_token,
                        refresh_token = EXCLUDED.refresh_token,
                        updated_at = NOW();
                """, (
                    user_id,
                    tokens.account_id,
                    tokens.access_token, encryption_key,
                    tokens.refresh_token, encryption_key,
                ))

            conn.commit()

        logger.info("Dropbox tokens encrypted and persisted for account %s / user %s", tokens.account_id, user_id)

        response.status_code = status.HTTP_200_OK
        return {
            "message": "Dropbox connected successfully",
            "account_id": tokens.account_id,
            "user_id": str(user_id),
        }

    except Exception as e:
        logger.error("Dropbox OAuth callback failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to connect Dropbox: {str(e)}",
        )


async def handle_dropbox_upload(
    request: Request,
    response: Response,
    user_id: str,
    project_id: str,
    file: UploadFile,
) -> dict:
    """
    Uploads a file to Dropbox under /survey-ops/users/{user_id}/projects/{project_id}/
    Fetches and decrypts tokens from DB by user_id.
    """
    try:
        encryption_key = _get_encryption_key()

        # Fetch and decrypt tokens from DB
        with PostgresConnectionPool().get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        pgp_sym_decrypt(access_token, %s),
                        pgp_sym_decrypt(refresh_token, %s)
                    FROM dropbox_tokens
                    WHERE user_id = %s;
                """, (encryption_key, encryption_key, user_id))
                row = cur.fetchone()

        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No Dropbox tokens found for user {user_id}. Please connect Dropbox first.",
            )

        access_token, refresh_token = str(row[0]), str(row[1])

        file_bytes = await file.read()
        filename = file.filename or f"upload_{project_id}"

        service = DropboxService()
        dropbox_path = build_dropbox_image_path(user_id, project_id, filename)

        metadata = service.upload_file(
            access_token=access_token,
            refresh_token=refresh_token,
            file_bytes=file_bytes,
            dropbox_path=dropbox_path,
        )

        logger.info(
            "Uploaded %s to Dropbox at %s for user %s / project %s",
            filename, dropbox_path, user_id, project_id,
        )

        response.status_code = status.HTTP_201_CREATED
        return {
            "message": "File uploaded successfully",
            "dropbox_path": metadata.get("path_display"),
            "file_id": metadata.get("id"),
            "size": metadata.get("size"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Dropbox upload failed for user %s / project %s: %s", user_id, project_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Dropbox upload failed: {str(e)}",
        )