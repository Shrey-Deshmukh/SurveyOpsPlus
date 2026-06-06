# SurveyOps+ Backend

## Platform Specific Setup

See [docs/README.md](docs/README.md) for prerequisites and platform-specific setup scripts.

## Prerequisites

- Docker & Docker Compose
- Python 3.10+
- Google Gemini API key — [Google AI Studio](https://aistudio.google.com/)
- Dropbox developer app (App Key + App Secret) — [dropbox.com/developers](https://www.dropbox.com/developers/apps)

---

## 1. Environment Variables

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `DB_NAME` | Postgres database name | `surveyopsplus` |
| `DB_USER` | Postgres user | `surveyopsplus_user` |
| `DB_PASSWORD` | Postgres password | `changeme` |
| `DB_HOST` | Postgres host | `localhost` (local dev) |
| `DB_PORT` | Postgres port | `5432` |
| `DB_MIN_CONN` | Min connection pool size | `1` |
| `DB_MAX_CONN` | Max connection pool size | `10` |
| `DB_ENCRYPTION_KEY` | Key to encrypt Dropbox tokens in DB | generate with `openssl rand -hex 32` |
| `DROPBOX_APP_KEY` | Dropbox app key | from Dropbox Developer Console |
| `DROPBOX_APP_SECRET` | Dropbox app secret | from Dropbox Developer Console |
| `DROPBOX_REDIRECT_URI` | OAuth callback URL | `http://localhost:8000/api/v1/dropbox/callback` |
| `DROPBOX_TEST_REFRESH_TOKEN` | Dropbox refresh token for integration tests | from Dropbox OAuth flow |
| `GOOGLE_API_KEY` | Google Gemini API key | from Google AI Studio |

---

## 2. Dropbox Setup

1. Go to [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps) and create a new app
2. Choose **Scoped Access** → **Full Dropbox**
3. Under **Permissions**, enable `files.content.write` and `files.content.read`, then hit **Submit**
4. Under **Settings**, add `http://localhost:8000/api/v1/dropbox/callback` as a Redirect URI
5. Copy the **App Key** and **App Secret** into your `.env`

---

## 3. Running with Docker (Recommended)

This spins up two containers — the FastAPI server and a PostgreSQL database.

```bash
cd containers
chmod +x build.sh
./build.sh
docker compose --env-file ../.env up -d
```

Verify both services are running:

```bash
docker ps
```

You should see `surveyopsplus-server` and `surveyopsplus-postgres` both with status `Up`.

The API will be available at `http://localhost:8000`.

### Stopping the services

```bash
cd containers
docker compose down
```

---

## 4. Running Locally (for Development)

If you want to run the FastAPI server outside Docker for faster iteration with `--reload`:

**Step 1** — Start only the Postgres container:

```bash
docker compose -f containers/docker-compose.yaml --env-file .env up -d surveyopsplus-postgres
```

**Step 2** — Set up the Python virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**Step 3** — Start the server:

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

---

## 5. Verifying the Setup

Once the server is running, hit the health check:

```bash
curl http://localhost:8000/health
```

To verify Dropbox OAuth is wired correctly:

1. Hit `GET /api/v1/dropbox/connect` — returns an `authorization_url`
2. Open the URL in a browser and log in with your Dropbox account
3. After authorizing, Dropbox redirects to the callback and returns a success response with your `account_id`

---

## 6. Running Tests

Make sure the Postgres container is running, then:

```bash
# From the backend/ directory
source .venv/bin/activate
pytest tests/
```

Integration tests spin up their own Docker fixture automatically.