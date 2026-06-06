# Dropbox Setup Guide

This guide explains how to get the required Dropbox API credentials for local development.

## Required Environment Variables

Add these to your `backend/.env` file:

```
DROPBOX_APP_KEY=your_app_key_here
DROPBOX_APP_SECRET=your_app_secret_here
DROPBOX_REDIRECT_URI=http://localhost:8000/api/v1/dropbox/callback
DB_ENCRYPTION_KEY=your_generated_encryption_key_here
DROPBOX_TEST_REFRESH_TOKEN=your_refresh_token_here
```

---

## Step 1 — Create a Dropbox Account

If you don't already have one, sign up for a free Dropbox account at https://www.dropbox.com.

---

## Step 2 — Register a Dropbox App

1. Go to https://www.dropbox.com/developers/apps
2. Click **Create App**
3. Choose **Scoped Access**
4. Choose **Full Dropbox**
5. Name the app (e.g. `survey-ops-plus`) — must be unique on Dropbox
6. Click **Create App**

---

## Step 3 — Get App Key and Secret

On the app settings page:
- Copy the **App Key** → set as `DROPBOX_APP_KEY`
- Click **Show** next to App Secret → set as `DROPBOX_APP_SECRET`

---

## Step 4 — Add Redirect URI

Under **OAuth 2 → Redirect URIs**, add:

```
http://localhost:8000/api/v1/dropbox/callback
```

Click **Add**.

---

## Step 5 — Set Permissions

Click the **Permissions** tab and enable:
- `files.content.write`
- `files.content.read`

Save the changes.

---

## Step 6 — Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Set the output as `DB_ENCRYPTION_KEY` in your `.env`.

---

## Step 7 — Get a Refresh Token (for integration tests)

1. Start the server: `uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload`
2. Hit `GET http://localhost:8000/api/v1/dropbox/connect`
3. Open the returned `authorization_url` in a browser and authorize
4. After the callback succeeds, fetch the refresh token from the DB:

```bash
docker exec -it surveyopsplus-postgres psql -U surveyopsplus_user -d surveyopsplus \
  -c "SELECT pgp_sym_decrypt(refresh_token, 'YOUR_DB_ENCRYPTION_KEY') FROM dropbox_tokens LIMIT 1;"
```

5. Set the output as `DROPBOX_TEST_REFRESH_TOKEN` in your `.env`

---

## Notes

- Never commit your `.env` file — it is in `.gitignore`
- For CI/CD, store all sensitive values as GitHub Actions secrets
- Each developer generates their own `DB_ENCRYPTION_KEY` locally — tokens encrypted by one key cannot be decrypted by another
