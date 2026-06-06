from llm.gemini import utils as gemini_utils
from llm.prompts import multi_image_tag_extraction_prompt_tagged
from llm.prompts.prompts import report_generation_prompt_tagged
from utils import resolve_path, write_to_file, generate_random_file_name
from google import genai
from typing import List, Tuple
import sys
import os
import random
import time


def generate_report_from_sample_exp(client: genai.Client, model_name: str) -> None:
    # context
    manual_ref: genai.types.File = upload_manuals(client)
    assert manual_ref.display_name is not None

    # upload prompt images
    uploaded_images, comma_separated_image_names = upload_exp_images(client)

    print("\nTag extraction:\n")
    tag_extraction_prompt = multi_image_tag_extraction_prompt_tagged(
        f"[Attached Reference Manual: {manual_ref.display_name}",
        comma_separated_image_names,
    )

    print(f"prompt: \n {tag_extraction_prompt}")

    delay = random.uniform(1.5, 5.0)
    time.sleep(delay)

    response, err = gemini_utils.prompt_with_multi_image_with_context(
        client, tag_extraction_prompt, [manual_ref], uploaded_images, model_name
    )
    if err is not None or response is None:
        sys.exit(f"[Error]: {err}, reponse: {response}")

    print("\nTag persisting:\n")

    json_response = response.text
    persist_json_response(json_response, model_name)

    # upload report template
    template_ref: genai.types.File = upload_template(client)
    assert template_ref.display_name is not None

    # upload report samples
    uploaded_sample_reports, comma_separated_sample_report_names = (
        upload_report_samples(client)
    )

    print("\nReport generation:\n")
    delay = random.uniform(1.5, 5.0)
    time.sleep(delay)

    report_gen_prompt = report_generation_prompt_tagged(
        comma_separated_sample_report_names,
        json_response,
        comma_separated_image_names,
        f"[Attached Report Template: {template_ref.display_name}",
    )

    print(f"prompt: \n {report_gen_prompt}")

    response, err = gemini_utils.prompt_with_multi_image_with_context_with_samples(
        client,
        report_gen_prompt,
        [manual_ref],
        uploaded_images,
        uploaded_sample_reports,
        model_name,
    )
    if err is not None or response is None:
        sys.exit(f"[Error]: {err}, reponse: {response}")

    print("\nReport persisting:\n")

    md_response = response.text
    persist_md_response(md_response, model_name)


def upload_exp_images(client: genai.Client) -> Tuple[List[genai.types.File], str]:
    uploaded_images = []
    image_names = []

    image_names_and_image_paths = _build_exp_image_paths()

    for image_name, image_path in image_names_and_image_paths:
        retry = 0
        while True:
            time.sleep(random.uniform(2.0, 3.0))
            res, err = gemini_utils.upload_file_to_server_sync(
                image_path,
                image_name,
                client,
            )
            if err is not None or res["result"] is None:
                retry += 1
                if retry == 3:
                    sys.exit(f"[Error]: {err}, result: {res}")

                delay = random.uniform(3.0, 5.0)
                print(f"retrying {image_name}, attempt: {retry}, after: {delay}s\n")
                time.sleep(delay)
            else:
                break

        uploaded_images.append(res["result"])
        image_names.append(f"[Image Reference Name: {image_name}]")

    return uploaded_images, ", ".join(image_names)


def _build_exp_image_paths() -> List[Tuple[str, str]]:
    exp_image_folder_path = "assets/test_imgs/experiment1"
    exp_image_folder_full_path = resolve_path.get_resolved_path(exp_image_folder_path)

    image_paths = [
        (f, os.path.join(exp_image_folder_full_path, f))
        for f in os.listdir(exp_image_folder_full_path)
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
    ]

    print(f"Found {len(image_paths)} images.")
    return image_paths


def upload_manuals(client: genai.Client) -> genai.types.File:
    refrigerated_cargo_doc_path = (
        "assets/knowledge_base/compliance_docs/Cargo-Advice-Refrigerated-cargoes.pdf"
    )
    refrigerated_cargo_doc_name = "refrigerated_cargo_doc"

    retry = 0
    while True:
        res, err = gemini_utils.upload_file_to_server_sync(
            resolve_path.get_resolved_path(refrigerated_cargo_doc_path),
            refrigerated_cargo_doc_name,
            client,
        )
        if err is not None or res["result"] is None:
            retry += 1
            if retry == 3:
                sys.exit(f"[Error]: {err}, result: {res}")

            delay = random.uniform(3.0, 5.0)
            print(
                f"retrying {refrigerated_cargo_doc_name}, attempt: {retry}, after: {delay}s\n"
            )
            time.sleep(delay)
        else:
            break

    refrigerated_cargo_doc = res["result"]

    return refrigerated_cargo_doc


def upload_template(client: genai.Client) -> genai.types.File:
    template_doc_path = "assets/knowledge_base/report_templates/template1.pdf"
    template_doc_name = "report_template_1_doc"

    retry = 0
    while True:
        res, err = gemini_utils.upload_file_to_server_sync(
            resolve_path.get_resolved_path(template_doc_path),
            template_doc_name,
            client,
        )
        if err is not None or res["result"] is None:
            retry += 1
            if retry == 3:
                sys.exit(f"[Error]: {err}, result: {res}")

            delay = random.uniform(3.0, 5.0)
            print(f"retrying {template_doc_name}, attempt: {retry}, after: {delay}s\n")
            time.sleep(delay)

        else:
            break

    template_doc = res["result"]

    return template_doc


def persist_json_response(reponse_json: str | None, model_name: str) -> None:
    if reponse_json is None:
        print("tag json is empty, no persistance required")
        return

    response_file_path = f"responses/experiment1/response_{generate_random_file_name()}_{model_name}.json"
    reponse_file_full_path = resolve_path.get_resolved_path(response_file_path)

    write_to_file(reponse_file_full_path, reponse_json)


def persist_md_response(reponse_md: str | None, model_name: str) -> None:
    if reponse_md is None:
        print("response md is empty, no persistance required")
        return

    response_file_path = (
        f"responses/experiment1/report_{generate_random_file_name()}_{model_name}.md"
    )
    reponse_file_full_path = resolve_path.get_resolved_path(response_file_path)

    write_to_file(reponse_file_full_path, reponse_md)


def upload_report_samples(client: genai.Client) -> Tuple[List[genai.types.File], str]:
    uploaded_sample_reports = []
    sample_report_names = []

    sample_report_names_and_paths = _build_report_sample_paths()
    for sample_report_name, sample_report_path in sample_report_names_and_paths:
        res, err = gemini_utils.upload_file_to_server_sync(
            sample_report_path,
            sample_report_name,
            client,
        )
        if err is not None or res["result"] is None:
            sys.exit(f"[Error]: {err}, result: {res}")

        uploaded_sample_reports.append(res["result"])
        sample_report_names.append(
            f"[Sample Report Reference Name: {sample_report_name}"
        )

    return uploaded_sample_reports, ", ".join(sample_report_names)


def _build_report_sample_paths() -> List[Tuple[str, str]]:
    sample_report_folder_path = "assets/knowledge_base/sample_reports"
    sample_folder_full_path = resolve_path.get_resolved_path(sample_report_folder_path)

    sample_report_paths = [
        (
            f,
            os.path.join(sample_folder_full_path, f),
        )
        for f in os.listdir(sample_folder_full_path)
        if f.lower().endswith((".pdf", ".md"))
    ]

    print(f"Found {len(sample_report_paths)} sample reports.")
    return sample_report_paths
