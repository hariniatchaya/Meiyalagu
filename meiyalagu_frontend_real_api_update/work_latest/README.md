# Meiyalagu AI frontend — backend API integration

This is an update to the existing React + Vite frontend; the existing UI, branding, bilingual layer, risk screening, disease library, history, and printable report screens are retained.

## Configure the backend

Copy `.env.example` to `.env` and set:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Use the actual reachable backend origin for your environment. Restart Vite after changing `.env`.

## Install and run

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## Image analysis contract

The API client in `src/services/api.js` uses only the specified endpoints:

1. `POST /api/analysis/upload` with multipart form field `image`
2. `POST /api/analysis/predict/{analysis_id}`
3. `GET /api/analysis/{analysis_id}`

The saved result must contain `analysis_id`, `predicted_class`, `confidence`, `status`, and optionally `heatmap_url`. The UI shows the backend class and confidence; a heatmap is rendered only when a non-empty URL is returned. It does not load PyTorch or model checkpoints in the browser and does not remap model labels into the seven educational library entries.

## Authentication integration note

**Existing frontend auth discrepancy:** the current `LoginPage` validates matching passwords for the sign-up form and then sets local React state; it does not call a backend login/register endpoint and does not obtain a token. The API service sends cookies (`credentials: include`) and forwards a bearer token only if the existing application has already stored one under `access_token`, `accessToken`, `auth_token`, or `token`. Those token keys are compatibility checks, not a new auth contract. The integration developer must connect the real existing backend authentication flow or provide its exact contract. Do not treat the current local login screen as secure backend authentication.

## Records, history, and reports

Successful analyses are saved to the existing browser history and can be opened in the existing result and printable report screens. Risk-screening records remain self-reported screening data and are not presented as model predictions. Existing historical local demo records are not automatically migrated or relabelled as real predictions.

## Pending backend dependencies

- Backend must implement and test the three specified endpoints and return the contract fields.
- CORS must allow the frontend origin and credentials if cookie authentication is used.
- Authentication must be connected to the backend's actual login/session flow.
- A real backend image inference and saved-result round trip has not been verified in this frontend-only task.
