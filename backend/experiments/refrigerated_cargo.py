from llm.gemini import utils as gemini_utils
from llm.prompts import refrigerated_cargo_prompt
from utils import resolve_path
from google import genai
import sys


def refriderated_cargo_exp(client: genai.Client, model_name: str) -> None:
    # context
    refrigerated_cargo_doc_path = (
        "assets/knowledge_base/compliance_docs/Cargo-Advice-Refrigerated-cargoes.pdf"
    )
    refrigerated_cargo_doc_name = "refrigerated_cargo_doc"
    res, err = gemini_utils.upload_file_to_server_sync(
        resolve_path.get_resolved_path(refrigerated_cargo_doc_path),
        refrigerated_cargo_doc_name,
        client,
    )
    if err is not None or res["result"] is None:
        sys.exit(f"[Error]: {err}, result: {res}")

    refrigerated_cargo_doc = res["result"]

    # prompt image
    fresh_produce_test_img_path = "assets/test_imgs/experiment1/fresh_produce_1.png"
    fresh_produce_test_img_name = "fresh_produce1"
    res, err = gemini_utils.upload_file_to_server_sync(
        resolve_path.get_resolved_path(fresh_produce_test_img_path),
        fresh_produce_test_img_name,
        client,
    )
    if err is not None or res["result"] is None:
        sys.exit(f"[Error]: {err}, result: {res}")

    fresh_produce_test_img = res["result"]

    prompt = refrigerated_cargo_prompt(
        refrigerated_cargo_doc_name, fresh_produce_test_img_name
    )

    response, err = gemini_utils.prompt_with_image_with_context(
        client, prompt, refrigerated_cargo_doc, fresh_produce_test_img, model_name
    )
    if err is not None or response is None:
        sys.exit(f"[Error]: {err}, reponse: {response}")

    print(response.text)
