# Production release

Frontend is deployed by Vercel from `main`. Firebase hosts backend Functions and RTDB rules.

## Firebase runtime variables

Set these for Functions before deployment:

- `TELEGRAM_BOT_TOKEN` — Telegram bot token.
- `ADMIN_TELEGRAM_IDS` — comma-separated Telegram user IDs allowed to receive the admin claim.
- `ALLOWED_ORIGINS` — optional comma-separated production origins. If empty, HTTPS endpoints use permissive CORS; authentication is still enforced by Telegram HMAC / Firebase ID tokens.

## Deploy backend

From the repository root with Firebase CLI authenticated:

```bash
firebase use nearme-app-59aa5
firebase deploy --only functions,database
```

The frontend derives HTTPS Function URLs automatically from `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_FUNCTIONS_REGION`, so separate Vercel URL variables are optional.

## Vercel

Production should build the `main` branch with:

```bash
npm ci
npm run build
```

Output directory: `dist`.

At minimum set:

```
VITE_FIREBASE_PROJECT_ID=nearme-app-59aa5
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
```

The Firebase web configuration already has safe public fallbacks in `src/firebase.ts`.

## Release check

1. GitHub CI is green.
2. Firebase Functions + RTDB rules are deployed.
3. Telegram bot token exists in Functions runtime.
4. Open the Mini App from Telegram, not a normal browser tab.
5. Verify login, map, profile registration, chat creation, message send, like/match and notifications.
