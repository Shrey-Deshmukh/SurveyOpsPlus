from google import genai
from typing import Tuple, List
import os
import time
import tempfile
from google.genai import types as genaiTypes


def upload_file_to_server_sync(
    path: str,
    image_name_model_id: str,
    client: genai.Client,
) -> Tuple[dict, str | None]:
    """
    Upload context per prompt
    """

    if not os.path.exists(path):
        return {"success": False, "result": None}, f"FileNotFound: {path}"

    try:
        print(f"Uploading {path}...")
        file_ref = client.files.upload(
            file=path, config={"display_name": image_name_model_id}
        )

        if file_ref.name is None:
            raise Exception("Missing file name metadata")

        if file_ref.state is None:
            raise Exception("File state is missing")

        file_name: str | None = file_ref.name
        while file_ref.state == genaiTypes.FileState.PROCESSING:
            print(".", end="", flush=True)
            time.sleep(2)
            file_ref = client.files.get(name=file_name)

        print()  # Newline after dots

        if file_ref.state == genaiTypes.FileState.FAILED:
            return {
                "success": False,
                "result": None,
            }, "Error: File processing failed on server or in unspecified state."

        if file_ref.state == genaiTypes.FileState.ACTIVE:
            return {"success": True, "result": file_ref}, None

        return {
            "success": False,
            "result": None,
        }, f"Error: Unexpected state: {file_ref.state}"

    except Exception as e:
        return {"success": False, "result": None}, f"Error: {str(e)}"


def upload_bytes_to_server_sync(
    file_bytes: bytes,
    display_name: str,
    client: genai.Client,
) -> Tuple[dict, str | None]:
    suffix = ""
    if "." in display_name:
        suffix = "." + display_name.split(".")[-1]

    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name
        return upload_file_to_server_sync(temp_path, display_name, client)
    except Exception as e:
        return {"success": False, "result": None}, f"Error: {str(e)}"
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


def prompt_text(
    client: genai.Client,
    prompt: str,
    model_name: str,
) -> Tuple[genaiTypes.GenerateContentResponse | None, str | None]:
    """Single-turn text-only generation (no attachments)."""
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[prompt],
        )
        return response, None
    except Exception as e:
        return None, f"Error: {str(e)}"


def prompt_with_image_with_context(
    client: genai.Client,
    prompt: str,
    context_file: genaiTypes.File,
    image_file: genaiTypes.File,
    model_name: str,
) -> Tuple[genaiTypes.GenerateContentResponse | None, str | None]:
    """
    Prompt LLM with uploaded context and prompt with image
    TODO: Make model dynamic
    """
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[prompt, context_file, image_file],
        )
        return response, None

    except Exception as e:
        return None, f"Error: {str(e)}"


def prompt_with_multi_image_with_context(
    client: genai.Client,
    prompt: str,
    context_files: List[genaiTypes.File],
    image_files: List[genaiTypes.File],
    model_name: str,
) -> Tuple[genaiTypes.GenerateContentResponse | None, str | None]:
    """
    Prompt LLM with uploaded contexts and prompt with images
    TODO: Make model dynamic
    """
    grounding_tool = genaiTypes.Tool(google_search=genaiTypes.GoogleSearch())
    config = genaiTypes.GenerateContentConfig(tools=[grounding_tool])

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[prompt, *context_files, *image_files],
            config=config,
        )
        return response, None

    except Exception as e:
        return None, f"Error: {str(e)}"


def prompt_with_multi_image_with_context_with_samples(
    client: genai.Client,
    prompt: str,
    context_files: List[genaiTypes.File],
    image_files: List[genaiTypes.File],
    sample_reports: List[genaiTypes.File],
    model_name: str,
) -> Tuple[genaiTypes.GenerateContentResponse | None, str | None]:
    """
    Prompt LLM with uploaded contexts and prompt with images, and search
    TODO: Make model dynamic
    """
    grounding_tool = genaiTypes.Tool(google_search=genaiTypes.GoogleSearch())
    config = genaiTypes.GenerateContentConfig(tools=[grounding_tool])

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[prompt, *context_files, *image_files, *sample_reports],
            config=config,
        )
        return response, None

    except Exception as e:
        return None, f"Error: {str(e)}"

def prompt_with_image_bytes_with_context(
    client: genai.Client,
    prompt: str,
    context_files: List[genaiTypes.File],
    image_bytes: bytes,
    image_mime_type: str,
    model_name: str,
) -> Tuple[genaiTypes.GenerateContentResponse | None, str | None]:
    """
    Prompt LLM with uploaded context files and image passed as raw bytes.
    Avoids temp file creation by using types.Part.from_bytes inline.
    """
    grounding_tool = genaiTypes.Tool(google_search=genaiTypes.GoogleSearch())
    config = genaiTypes.GenerateContentConfig(tools=[grounding_tool])
    try:
        image_part = genaiTypes.Part.from_bytes(
            data=image_bytes,
            mime_type=image_mime_type,
        )
        response = client.models.generate_content(
            model=model_name,
            contents=[prompt, *context_files, image_part],
            config=config,
        )
        return response, None
    except Exception as e:
        return None, f"Error: {str(e)}"
