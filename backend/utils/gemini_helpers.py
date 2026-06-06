# utils/gemini_helpers.py
import os
import time
import random
import logging
import hashlib
from llm.gemini import utils as gemini_utils
from utils.resolve_path import get_resolved_path

logger = logging.getLogger(__name__)

# Process-local cache: compliance manual uploaded once per resolved path.
_uploaded_manual_cache: dict[str, object] = {}
_uploaded_report_attachment_cache: dict[str, object] = {}


def get_or_upload_manual(client, path: str, name: str):


    resolved = path if os.path.isabs(path) else get_resolved_path(path)
    cached = _uploaded_manual_cache.get(resolved)
    if cached is not None:
        return cached, None
    ref, err = upload_with_retry(client, path, name)
    if err is None and ref is not None:
        _uploaded_manual_cache[resolved] = ref
    return ref, err


def upload_with_retry(client, path: str, name: str, retries: int = 3):

    resolved = path if os.path.isabs(path) else get_resolved_path(path)
    for attempt in range(retries):
        res, err = gemini_utils.upload_file_to_server_sync(resolved, name, client)
        if err is None and res["result"] is not None:
            return res["result"], None
        delay = random.uniform(3.0, 5.0)
        logger.warning(f"retrying {name}, attempt: {attempt + 1}, after: {delay:.2f}s, err: {err}")
        time.sleep(delay)
    return None, f"Failed to upload {name} after {retries} attempts"

def upload_images(client, image_paths: list):
    uploaded_images = []
    image_names = []
    for image_path in image_paths:
        image_name = os.path.basename(image_path)
        result, err = upload_with_retry(client, image_path, image_name)
        if err:
            logger.warning(f"Skipping {image_name}: {err}")
            continue
        uploaded_images.append(result)
        image_names.append(f"[Image Reference Name: {image_name}]")
    return uploaded_images, ", ".join(image_names)

def upload_sample_reports(client, sample_report_paths: list):
    uploaded = []
    names = []
    for path in sample_report_paths:
        name = os.path.basename(path)
        result, err = upload_with_retry(client, path, name)
        if err:
            logger.warning(f"Skipping {name}: {err}")
            continue
        uploaded.append(result)
        names.append(f"[Sample Report Reference Name: {name}]")
    return uploaded, ", ".join(names)


def upload_bytes_with_retry(client, file_bytes: bytes, display_name: str, retries: int = 3):
    for attempt in range(retries):
        res, err = gemini_utils.upload_bytes_to_server_sync(file_bytes, display_name, client)
        if err is None and res["result"] is not None:
            return res["result"], None
        delay = random.uniform(3.0, 5.0)
        logger.warning(f"retrying {display_name}, attempt: {attempt + 1}, after: {delay:.2f}s, err: {err}")
        time.sleep(delay)
    return None, f"Failed to upload {display_name} after {retries} attempts"


def upload_report_attachments(client, attachments: list[dict], reference_label: str):
    uploaded = []
    names = []
    for attachment in attachments:
        attachment_bytes = attachment.get("bytes")
        if not attachment_bytes:
            continue
        filename = attachment.get("filename") or "attachment"
        digest = hashlib.sha256(attachment_bytes).hexdigest()
        cache_key = f"{digest}:{filename}"

        cached = _uploaded_report_attachment_cache.get(cache_key)
        if cached is not None:
            uploaded.append(cached)
            names.append(f"[{reference_label}: {filename}]")
            continue

        result, err = upload_bytes_with_retry(client, attachment_bytes, filename)
        if err:
            logger.warning(f"Skipping {filename}: {err}")
            continue

        _uploaded_report_attachment_cache[cache_key] = result
        uploaded.append(result)
        names.append(f"[{reference_label}: {filename}]")

    return uploaded, ", ".join(names)
