# PharmaLink Admin

Admin dashboard for PharmaLink — React + Vite + TypeScript + Tailwind (shadcn-style UI),
themed to match the mobile app (primary green `#1A998E`).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

The backend (same one used by mobile) must be running on `http://localhost:3001`.
Override with an env var if needed:

```
# admin/.env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

## Auth

- Login calls `POST /admin/admins/login`; the backend sets an **httpOnly** `admin_token`
  cookie (not readable by JS — XSS-safe). No token is stored in localStorage.
- All API calls use `fetch(..., { credentials: "include" })` so the cookie is sent.
- `GET /admin/admins/me` restores the session on load; `ProtectedRoute` guards pages.
- Logout: `POST /admin/admins/logout` clears the cookie.
- Only users with role `admin` can log in.

Default admin (dev): `adi@sizu.dev` / `123456`.

## Features (v1)

- **Dashboard** — totals (patients, pharmacists, pharmacies, transactions, revenue) + recent transactions.
- **Transactions** — list/search/filter; update status following the lifecycle state machine.
- **Pharmacists / Patients** — list/search; activate / deactivate.
- **Pharmacies** — list/search; activate / deactivate.

## Structure

- `src/lib/api.ts` — fetch client (credentials included).
- `src/contexts/AuthContext.tsx` — cookie-based auth.
- `src/components/ui/*` — shadcn-style primitives (button, card, table, badge, input).
- `src/components/Layout.tsx` — sidebar + topbar (dark-mode toggle).
- `src/pages/*` — Dashboard, Transactions, Users (patients/pharmacists), Pharmacies.
