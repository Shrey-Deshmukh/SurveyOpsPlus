import logging
import os
import urllib.parse
from dataclasses import dataclass

import requests

from src.services.storage.constants import (
    DROPBOX_AUTH_URL,
    DROPBOX_REVOKE_URL,
    DROPBOX_TOKEN_URL,
    DROPBOX_UPLOAD_URL,
)

logger = logging.getLogger(__name__)


@dataclass
class DropboxTokens:
    access_token: str
    refresh_token: str
    account_id: str


class DropboxService:
    """
    Handles Dropbox OAuth 2.0 (offline/server-side) and file uploads.

    Flow:
      1. get_authorization_url()  → redirect user to Dropbox login
      2. exchange_code_for_tokens(code) → store returned DropboxTokens in DB
      3. upload_file(access_token, ...) → upload image bytes
         - If 401, call refresh_access_token(refresh_token) and retry once
    """

    def __init__(self):
        self.app_key = os.environ["DROPBOX_APP_KEY"]
        self.app_secret = os.environ["DROPBOX_APP_SECRET"]
        self.redirect_uri = os.environ["DROPBOX_REDIRECT_URI"]

    def get_authorization_url(self, state: str) -> str:
        """
        Build the Dropbox OAuth consent URL.
        `state` should be a CSRF token tied to the user's session.
        """
        params = {
            "client_id": self.app_key,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "token_access_type": "offline",
            "state": state,
        }
        return f"{DROPBOX_AUTH_URL}?{urllib.parse.urlencode(params)}"

    def exchange_code_for_tokens(self, code: str) -> DropboxTokens:
        """
        Called in the OAuth callback route after Dropbox redirects back.
        Returns access_token + refresh_token — persist both in DB.
        """
        resp = requests.post(
            DROPBOX_TOKEN_URL,
            data={
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": self.redirect_uri,
            },
            auth=(self.app_key, self.app_secret),
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        logger.info("Dropbox token exchange successful for account %s", data.get("account_id"))
        return DropboxTokens(
            access_token=data["access_token"],
            refresh_token=data["refresh_token"],
            account_id=data["account_id"],
        )

    def refresh_access_token(self, refresh_token: str) -> str:
        """
        Exchanges a refresh token for a new short-lived access token.
        """
        resp = requests.post(
            DROPBOX_TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
            auth=(self.app_key, self.app_secret),
            timeout=10,
        )
        if not resp.ok:
            raise Exception(f"Token refresh failed: {resp.status_code} — {resp.text}")
        new_access_token: str = resp.json()["access_token"]
        logger.info("Dropbox access token refreshed successfully")
        return new_access_token

    def upload_file(
        self,
        access_token: str,
        refresh_token: str,
        file_bytes: bytes,
        dropbox_path: str,
        overwrite: bool = False,
    ) -> dict:
        """
        Uploads raw bytes to Dropbox at `dropbox_path`.
        Automatically refreshes the access token once on 401 and retries.
        Returns the Dropbox file metadata dict on success.
        """
        mode = "overwrite" if overwrite else "add"
        result = self._do_upload(access_token, file_bytes, dropbox_path, mode)

        if result.status_code in (400, 401):
            logger.warning("Dropbox access token invalid — refreshing and retrying")
            access_token = self.refresh_access_token(refresh_token)
            result = self._do_upload(access_token, file_bytes, dropbox_path, mode)

        try:
            result.raise_for_status()
        except Exception as e:
            raise Exception(f"{e} — Dropbox response: {result.text}") from e
        return result.json()

    def _do_upload(
        self,
        access_token: str,
        file_bytes: bytes,
        dropbox_path: str,
        mode: str,
    ) -> requests.Response:
        import json
        response = requests.post(
            DROPBOX_UPLOAD_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/octet-stream",
                "Dropbox-API-Arg": json.dumps({
                    "path": dropbox_path,
                    "mode": mode,
                    "autorename": True,
                    "mute": False,
                }),
            },
            data=file_bytes,
            timeout=60,
        )
        if not response.ok:
            logger.error("Dropbox upload error response: %s", response.text)
        return response

    def revoke_token(self, access_token: str) -> None:
        resp = requests.post(
            DROPBOX_REVOKE_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        resp.raise_for_status()
        logger.info("Dropbox token revoked")