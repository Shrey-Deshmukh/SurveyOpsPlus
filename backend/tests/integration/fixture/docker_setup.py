import pytest
import os
import shutil
import subprocess
import uuid
import time
import requests
import psycopg2
from dotenv import load_dotenv
from testcontainers.compose import DockerCompose


def _load_env(root: str):
    env_file = os.path.join(root, ".env")
    load_dotenv(env_file)


def wait_for_url(url, timeout=30):
    stop_time = time.time() + timeout
    while time.time() < stop_time:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return True
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(1)
    raise TimeoutError(f"Service at {url} failed to start within {timeout} seconds")


def wait_for_postgres(host, port, user, password, dbname, timeout=60):
    stop_time = time.time() + timeout
    while time.time() < stop_time:
        try:
            conn = psycopg2.connect(
                host=host, port=port, user=user,
                password=password, dbname=dbname
            )
            conn.close()
            return True
        except Exception:
            pass
        time.sleep(1)
    raise TimeoutError(f"Postgres at {host}:{port} failed to become ready within {timeout} seconds")


@pytest.fixture(scope="session")
def build_images():
    """Builds the docker images only once for the entire test run."""
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    _load_env(root)

    containers_dir = os.path.join(root, "containers")
    build_script = os.path.join(containers_dir, "build.sh")

    bash = "bash"
    if os.name == "nt":
        bash = os.path.join("C:\\", "Program Files", "Git", "bin", "bash.exe")

    print("\n--- [SESSION SETUP] Building Docker images ---")
    subprocess.run([bash, build_script], check=True, cwd=containers_dir)


@pytest.fixture(scope="function")
def docker_env(build_images):
    """
    Starts a fresh set of containers for every individual test.
    """
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    containers_dir = os.path.join(root, "containers")

    test_id = uuid.uuid4().hex[:8]

    os.environ["SERVER_HOST_PORT"] = "0"
    os.environ["POSTGRES_HOST_PORT"] = "0"
    os.environ["SERVER_CONTAINER_NAME"] = f"surveyopsplus-server-test-{test_id}"
    os.environ["POSTGRES_CONTAINER_NAME"] = f"surveyopsplus-postgres-test-{test_id}"

    # Copy .env to containers dir so Docker Compose picks up all env vars
    env_src = os.path.join(root, ".env")
    env_dst = os.path.join(containers_dir, ".env")
    shutil.copy2(env_src, env_dst)

    print(f"\n--- [TEST SETUP] Starting isolated containers (ID: {test_id}) ---")

    try:
        with DockerCompose(
            context=containers_dir, compose_file_name="docker-compose.yaml"
        ) as compose:
            server_host = compose.get_service_host("surveyopsplus-server", 8000)
            server_port = compose.get_service_port("surveyopsplus-server", 8000)
            base_url = f"http://{server_host}:{server_port}"

            db_host = compose.get_service_host("surveyopsplus-postgres", 5432)
            db_port = compose.get_service_port("surveyopsplus-postgres", 5432)

            wait_for_postgres(
                host=db_host,
                port=int(db_port),
                user=os.environ["DB_USER"],
                password=os.environ["DB_PASSWORD"],
                dbname=os.environ["DB_NAME"],
            )

            wait_for_url(f"{base_url}/api/v1/health", timeout=120)

            yield {
                "server_url": base_url,
                "db_host": db_host,
                "db_port": int(db_port),
                "db_name": os.environ["DB_NAME"],
                "db_user": os.environ["DB_USER"],
                "db_password": os.environ["DB_PASSWORD"],
            }

    except TimeoutError as e:
        pytest.exit(
            f"CRITICAL FAILURE: Docker environment timed out. {e}", returncode=1
        )
    except Exception as e:
        pytest.exit(f"FAILURE: Could not start DockerCompose. {e}", returncode=1)
    finally:
        # Remove copied .env from containers dir
        if os.path.exists(env_dst):
            os.remove(env_dst)
        for key in ["SERVER_HOST_PORT", "POSTGRES_HOST_PORT",
                    "SERVER_CONTAINER_NAME", "POSTGRES_CONTAINER_NAME"]:
            os.environ.pop(key, None)