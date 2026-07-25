# Aetheris — Bachs "enter amount, pay" page

A ready-to-run Next.js app. One page (`/pay`): the customer types in an
amount, hits Pay, and completes payment in an in-page overlay — they never
leave your site. Root `/` redirects straight there.

## ⚠️ Rotate your keys first — do this before anything else

A live secret key and webhook secret were pasted in plain chat earlier.
Treat both as compromised:

1. Bachs Developer Portal → API Keys → revoke `sk_live_cd35ba66_...` and
   generate a new one.
2. Developer Portal → Webhooks → your endpoint → rotate the signing secret
   (the old one stops working the moment you do this, so update your env
   var in the same step).
3. Never paste `sk_...` keys into a chat, a repo, or client-side code again
   — they only ever belong in server environment variables (`.env.local`
   locally, the host's dashboard in production).

## Project structure

```
app/
  layout.tsx              root HTML shell (this is what replaces index.html
                           in the App Router — there is no index.html here)
  page.tsx                redirects "/" to "/pay"
  pay/
    page.tsx              the Aetheris-branded pay page
    success/page.tsx       shown after a successful payment (return_url)
  api/
    checkout/route.ts      creates a checkout session for the entered amount
    webhooks/bachs/route.ts  verifies signatures, is the source of truth for fulfilment
lib/
  bachs.ts                 raw fetch wrapper matching Bachs' documented REST contract
```

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in your NEW, rotated sandbox key
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/pay`.

### Before it actually works

1. **The product must be custom-priced.** `BACHS_PRODUCT_ID` needs
   `custom_amount_enabled: true` (pay-what-you-want) in the Bachs dashboard,
   or the amount override in `/api/checkout` will be rejected.
2. Fill in `.env.local` with your rotated sandbox key
   (`BACHS_API_KEY=sk_sandbox_...`), the product ID, and a webhook secret.
3. In the Bachs Developer Portal, add a webhook destination at
   `https://<your-deployed-domain>/api/webhooks/bachs`, subscribed at least
   to `collection.succeeded`.
4. Test the full flow in sandbox with a Bachs test card before touching
   production.

## Push to GitHub

```bash
git init
git add .
git commit -m "Aetheris pay page"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`.gitignore` already excludes `.env.local` and `node_modules` — double
check `git status` before your first commit and confirm no `.env*` file
(other than `.env.example`) is staged.

## Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → import the GitHub repo you
   just pushed. Vercel auto-detects Next.js — no config needed.
2. Before the first deploy (or right after, then redeploy), go to
   **Project → Settings → Environment Variables** and add:
   - `BACHS_API_KEY`
   - `BACHS_ENV` (`sandbox` while testing, `live` when ready)
   - `BACHS_WEBHOOK_SECRET`
   - `BACHS_PRODUCT_ID`
   - `APP_URL` — set this to your real Vercel URL, e.g.
     `https://aetheris.vercel.app` (needed so `return_url`/`cancel_url` are
     correct)
3. Deploy. Then update your Bachs webhook destination to point at
   `https://<your-vercel-domain>/api/webhooks/bachs`.

## Going live

Change `BACHS_ENV` to `live` and swap in an `sk_live_...` key (Vercel env
var, not code). Nothing else changes — the checkout session's
`checkout_url` already reflects the right environment, so the page code is
identical in sandbox and production.
