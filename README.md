# DARK NINJA BIN Lookup Backend

This backend fetches **public BIN/IIN metadata only** from Binlist. It is not a payment processor and must not be used to submit full card numbers, CVVs, expiry dates, or other payment credentials.

## Requirements
- Node.js 18 or newer
- A hosting service that supports Node.js (for example Render)

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:3000/` to see the health response. Test a lookup at `http://localhost:3000/api/bin/457173` using a public 6-digit prefix.

## Deploy on Render (one straightforward option)
1. Upload these project files to a new GitHub repository.
2. In Render, create a **Web Service** and connect that repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Optional environment variable: `ALLOWED_ORIGIN` set to the exact origin of the page hosting your HTML (for example `https://your-site.example`). Leave it unset only while testing; the default `*` allows browser origins but is less restrictive.
6. Deploy, then open the service root URL. It should return JSON with `status: "online"`.
7. Test `/api/bin/457173` on that same host. Once confirmed, update the HTML's `BIN_API`/lookup function to call your backend URL.

## Endpoint
`GET /api/bin/:prefix`

- Accepts exactly 6 or 8 numeric digits.
- Applies a basic per-IP rate limit (30 requests per hour).
- Uses the upstream `Accept-Version: 3` header.
- Returns provider JSON on success and a useful JSON error on failure.

## Notes
- Hosting providers and Binlist may impose their own limits or availability constraints.
- This project does not persist lookup history; existing browser-side history remains in the HTML.
- Before production, set `ALLOWED_ORIGIN` to the exact origin hosting your HTML.
