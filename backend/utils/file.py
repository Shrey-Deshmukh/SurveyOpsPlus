import uuid
import datetime
import os


# utils/file.py
from pypdf import PdfReader

def load_file_text(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        reader = PdfReader(path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    else:  # .txt or .md
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

def read_text_file(path: str) -> str:
    """Load a text file and return as string."""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()
def write_to_file(file_path: str, content: str):
    """
    Writes content to a file path.
    Creates the file and any missing parent directories.
    """
    directory = os.path.dirname(file_path)

    if directory:
        os.makedirs(directory, exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)


def generate_random_file_name() -> str:
    short_uuid = str(uuid.uuid4())[:5]
    date_str = datetime.date.today().strftime("%Y_%m_%d")

    return f"{short_uuid}_{date_str}"
