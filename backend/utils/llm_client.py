import os
from google import genai
from dotenv import load_dotenv


def resolve_google_model(model_name: str | None = None) -> str:
    DEFAULT_GOOGLE_MODEL = "gemini-2.5-flash"

    load_dotenv()

    explicit_model = (model_name or "").strip()
    if explicit_model:
        return explicit_model

    env_model = (os.getenv("GOOGLE_MODEL") or "").strip()
    if env_model:
        return env_model

    return DEFAULT_GOOGLE_MODEL


def getLLMClient(model_provider: str) -> genai.Client:
    load_dotenv()

    match model_provider:
        case "google":
            client = genai.Client()
        case _:
            raise Exception("[Error]: Unknown LLM provider name, cannot fetch client")

    return client
