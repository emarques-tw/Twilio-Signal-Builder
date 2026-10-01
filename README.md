# Twilio-Signal-Builder — Builder MX Operator Console

Static React + Twilio Paste UI for advancing Builder MX orders through their
state machine. Hosted on GitHub Pages, calls two Twilio Functions.

## Local development

```bash
cp .env.example .env.local  # then edit VITE_FUNCTIONS_BASE_URL if needed
npm install
npm run dev
```

Open the printed URL. Log in with the same `SHARED_SECRET` set on the
Twilio Functions service.

## Deploy to GitHub Pages

This directory is meant to live at the root of the
`emarques-tw/Twilio-Signal-Builder` repo.

1. Create the repo on GitHub (public).
2. Copy this folder's contents to the repo root, `git init && git push`.
3. In the repo → **Settings** → **Pages** → set **Source** to
   *GitHub Actions*.
4. In **Settings** → **Secrets and variables** → **Actions** → add
   `VITE_FUNCTIONS_BASE_URL` = `https://funko-6929.twil.io`.
5. Push to `main`. The workflow deploys to
   `https://emarques-tw.github.io/Twilio-Signal-Builder/`.

## Backend contract

Requires the Twilio Functions in `../serverless/`:

- `GET  /list_orders`  — returns all Airtable records, newest first
- `POST /advance_state` — advances Ordered → Selecting → Building → Built

Both require the `X-Funko-Secret` header matching `SHARED_SECRET`.
CORS allowlist lives in `serverless/functions/_cors.private.js`:
`https://emarques-tw.github.io`, `http://localhost:5173`,
`http://127.0.0.1:5173`.
