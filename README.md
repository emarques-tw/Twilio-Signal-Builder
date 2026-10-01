# Twilio-Signal-Builder — Builder MX Operator Console

Static React + Twilio Paste application for viewing Airtable orders and
advancing their physical build lifecycle. The app is hosted on GitHub Pages
and calls the Twilio Functions deployed at `https://funko-6929.twil.io`.

## Current capabilities

- Lists orders from `GET /list_orders`, newest first.
- Filters/searches by order number, box name, WhatsApp address, or status.
- Advances orders through:
  `Ordered → Selecting → Building → Built → Delivered`.
- Sends the matching WhatsApp status template on each transition.
- Requires confirmation before marking a Builder as `Built` or an order as
  `Delivered`.
- Logs in with the shared secret configured as `SHARED_SECRET` on the
  Functions service. The secret is held in browser `sessionStorage` and sent
  as `X-Funko-Secret`; it is not embedded in the published JavaScript.

## Local development

Requirements: Node.js 20 or newer and npm.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

`.env.example` sets `VITE_FUNCTIONS_BASE_URL` to the production Functions
domain. Override it in `.env.local` to use another backend. The shared secret
is entered in the app's login screen, not in `.env.local`.

Validate a production build locally:

```bash
npm run build
```

## Publish to GitHub Pages

This project is the root of the `emarques-tw/Twilio-Signal-Builder`
repository. Publishing is automated by
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):

1. In the repository's **Settings → Pages**, set the source to **GitHub
   Actions**.
2. In **Settings → Secrets and variables → Actions**, set
   `VITE_FUNCTIONS_BASE_URL` to `https://funko-6929.twil.io`.
3. Push the intended changes to `main`, or start **Deploy op-ui to GitHub
   Pages** with the workflow's `workflow_dispatch` option.
4. Confirm the build and deployment jobs succeed in **Actions**.

The deployed app is at
<https://emarques-tw.github.io/Twilio-Signal-Builder/>.

The workflow runs `npm ci` and `npm run build` with Node 20, then deploys
`dist/`. Only the Functions base URL belongs in the build configuration; do
not put `SHARED_SECRET` or Twilio credentials in GitHub Pages settings.

## Backend contract

The UI expects the matching Functions environment to have `AIRTABLE_PAT`,
`AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_ID`, `SHARED_SECRET`, and
`WHATSAPP_FROM` configured.

- `GET /list_orders` — returns Airtable order records; requires
  `X-Funko-Secret`.
- `POST /advance_state` — accepts `{ "recordId": "...", "targetState":
  "Selecting" | "Building" | "Built" | "Delivered" }`; requires
  `X-Funko-Secret`.

The backend only accepts the next legal transition, sends its status Content
template, and updates Airtable. Before enabling delivery, the Airtable
`Status` single-select must include `Delivered` and the table must contain
the `EntregadoSentAt` date/time field.

CORS is restricted in the backend helper to
`https://emarques-tw.github.io` plus the local Vite origins
`http://localhost:5173` and `http://127.0.0.1:5173`.

## Source and publishing relationship

The deployed GitHub repository is the source of truth for this UI. In the
Funko-MX workspace, `op-ui/` tracks a pinned copy of that repository; keep
the standalone repository's React source in sync when publishing UI changes.
