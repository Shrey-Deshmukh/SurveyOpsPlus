def build_dropbox_image_path(user_id: str, project_id: str, filename: str) -> str:
    """
    Returns a namespaced Dropbox path:
      /survey-ops/users/{user_id}/projects/{project_id}/{filename}
    """
    return f"/survey-ops/users/{user_id}/projects/{project_id}/{filename}"