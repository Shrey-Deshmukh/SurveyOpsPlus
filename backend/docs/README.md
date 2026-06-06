# SurveyOpsPlus Backend — Prerequisites

Before running the backend, ensure your system has the following tools installed:

| Tool | Minimum Version |
|------|----------------|
| Python | 3.10+ |
| pip | Any |
| Docker | Latest |
| Docker Compose | Latest |
| Git | Any |

## Prerequisite Check Scripts

Run the appropriate script for your platform to verify your system meets all requirements. The script will list any missing tools.

**Windows (PowerShell):**
```powershell
.\docs\windows\prerequisite.ps1
```

**Linux / macOS (bash):**
```bash
chmod +x docs/<your-platform>/prerequisite.sh
./docs/<your-platform>/prerequisite.sh
```

Where `<your-platform>` is one of: `ubuntu`, `arch`, `osx`.

## Setup

1. Clone the repo and navigate to the backend folder.

2. Copy the environment file and fill in the values:
```bash
cp .env.example .env
```

See the [environment variables table](README.md#environment-variables) for all required keys.

3. Export environment variables and start the containers:
```bash
export $(grep -vE '^\s*#|^\s*$' .env | xargs)
chmod +x containers/build.sh
./containers/build.sh
docker compose -f containers/docker-compose.yaml up -d
```

4. (Non-containerized) Run the backend server locally:
```bash
python3 -m venv .venv
source .venv/bin/activate        # Linux / macOS
.venv\Scripts\activate           # Windows
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```