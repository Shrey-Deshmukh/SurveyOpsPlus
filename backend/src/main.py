from dotenv import load_dotenv
load_dotenv()

# from experiments import refriderated_cargo_exp, generate_report_from_sample_exp
# from utils import getLLMClient, getArgs,
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.utils.server import build_options
from src.gateway import get_server_with_opts
from src.db import PostgresConnectionPool
import logging

# import argparse
# import sys

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Server starting up...")
    PostgresConnectionPool().verify_connection()
    yield
    logger.info("Server shutting down — closing DB connections...")
    PostgresConnectionPool().close_all()


opts = build_options(lifespan=lifespan)
app = get_server_with_opts(opts)


def main():
    print("Gateway app is ready. Run with:")
    print("uvicorn src.gateway.main:app --host 0.0.0.0 --port 8000")


if __name__ == "__main__":
    main()
    # args = getArgs()
    #
    # match args:
    #     case argparse.Namespace(experiment=expId) if expId is not None:
    #         model_provider = args.provider
    #         model_name = args.model
    #         assert model_provider is not None
    #         assert model_name is not None
    #
    #         client = getLLMClient(model_provider)
    #         print(
    #             f"\nUsing client {client} from provider {model_provider} and model {model_name}\n"
    #         )
    #
    #         match expId:
    #             case 0:
    #                 print(
    #                     f"Running experiment {expId}: test for tagging refriderated cargo with images\n"
    #                 )
    #                 refriderated_cargo_exp(client, model_name)
    #
    #             case 1:
    #                 print(f"Running experiment {expId}: report generation test\n")
    #                 generate_report_from_sample_exp(client, model_name)
    #
    #             case _:
    #                 sys.exit(f"Experiment with {expId} is not defined")
