from pathlib import Path

"""
Utils to resolve relative paths for assets in folder
"""


def _get_project_root() -> Path:
    """
    Root path of the project
    """

    script_path = Path(__file__).resolve()
    src_dir = script_path.parent
    project_root = src_dir.parent

    return project_root


def get_resolved_path(relative_path: str) -> str:
    """
    Returns full path when provided with relative path
    """

    root = _get_project_root()
    full_path = root / relative_path

    return str(full_path)
