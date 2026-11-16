# Stars For Meat (النجوم) — Staff Dashboard

Staff dashboard for the B2B website. React 19 + Vite + TypeScript + Tailwind 4 + TanStack Query.
Arabic (RTL, default) and English (LTR). Talks only to **alnojoom-backend**.

> Not related to the Star Meat B2C e-commerce repos in `Star Meat E-commerce App/`.

## Run locally
```bash
npm install
cp .env.example .env        # VITE_API_URL = the backend, e.g. http://localhost:4000
npm run dev                 # http://localhost:5173
```
The backend must list this origin in `CORS_ORIGINS`. Create the first admin from the backend repo:
`npm run staff:create-admin -- you@company.sa "Your Name"`.

## Screens
| Screen | Permission |
|---|---|
| Sign in, change password (forced after first sign-in / reset) | — |
| Home: counts + duplicate ERP-name warning | per card |
| Products: search, filters, create/edit, hide, delete/restore, images (upload, order, delete) | `products.manage` |
| Offers: 5 slots, Arabic/English desktop + mobile images, link, visible toggle | `offers.manage` |
| Staff: create (one-time temporary password), change role, deactivate, reset password | `staff.manage` |
| Roles & permissions | `staff.manage` |

The menu hides what a role can't use, but the API is what enforces permissions.

## Rules
- All UI text lives in `src/i18n/messages.ts` (`ar` first; `en` has the same keys, TypeScript checks it).
- API errors arrive as codes; add a translation to `errors` for every new code.
- Use logical CSS (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`). Wrap numbers, emails, codes and paths in `className="ltr"`.

## Build & deploy
```bash
npm run build               # type-check + static files in dist/
```
`dist/` is plain static files: upload it anywhere (shared hosting, Nginx, a sub-domain such as `admin.example.sa`).
- `VITE_API_URL` is baked in at build time: rebuild after changing it.
- In a sub-folder: `BASE_PATH=/admin/ npm run build`.
- `dist/.htaccess` (Apache) sends unknown paths to `index.html`; on Nginx use `try_files $uri /index.html;`.
- Keep the dashboard and API on the same site (e.g. `admin.example.sa` + `api.example.sa`) so the `SameSite=Lax`
  session cookie is sent.
