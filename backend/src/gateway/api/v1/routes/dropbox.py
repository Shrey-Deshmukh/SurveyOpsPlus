from fastapi import APIRouter, Request, Response, UploadFile, File
from src.gateway.api.v1.handlers.dropbox_handler import (
    handle_dropbox_connect,
    handle_dropbox_callback,
    handle_dropbox_upload,
)
from src.gateway.types import ServerOpts


def register_dropbox_routes(router: APIRouter, opts: ServerOpts):

    @router.get("/dropbox/connect")
    async def dropbox_connect(request: Request, response: Response):
        """
        Returns the Dropbox OAuth authorization URL.
        The frontend should open this URL so the user can log in to Dropbox.
        """
        return await handle_dropbox_connect(request, response)

    @router.get("/dropbox/callback")
    async def dropbox_callback(request: Request, response: Response, code: str, state: str):
        """
        OAuth callback — Dropbox redirects here with ?code=...&state=...
        Exchanges the code for tokens and persists them.
        """
        return await handle_dropbox_callback(request, response, code, state)

    @router.post("/dropbox/upload")
    async def dropbox_upload(
        request: Request,
        response: Response,
        user_id: str,
        project_id: str,
        file: UploadFile = File(...),
    ):
        """
        Upload a single image file to Dropbox under the project's folder.
        Expects the user's Dropbox tokens to already be stored in DB.
        """
        return await handle_dropbox_upload(request, response, user_id, project_id, file)