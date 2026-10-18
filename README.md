# MANDE Shop

The customer shop (`shop.mande.com.ng`): browse, search and buy furniture from MANDE manufacturers. Next.js 16 with Cache Components; the catalogue pages render on the server and the visitor's own data (cart, wishlist, account) loads in the browser. The plan is `../SHOP_IMPLEMENTATION.md`, and the project rules are in `CLAUDE.md`.

## Getting started

Needs the API (`mande-backend`) running, on http://localhost:4000 by default.

```bash
npm install
npm run dev
```

Then open http://localhost:3020. The dev port is fixed in `package.json`, so the shop never clashes with `mande-frontend` (3010).

### Environment variables

Next.js reads `.env.local`, which git ignores. Without one, the defaults below work for local development.

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SHOP_URL=http://localhost:3020
NEXT_PUBLIC_MAIN_SITE_URL=http://localhost:3010
```

| Variable | Purpose | Required | Default | Read in |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the REST API | No (yes in production) | `http://localhost:4000/api/v1` | `lib/site.ts` |
| `NEXT_PUBLIC_SHOP_URL` | The shop's own public URL, for SEO, the sitemap and absolute links | No (yes in production) | `http://localhost:3020` | `lib/site.ts` |
| `NEXT_PUBLIC_MAIN_SITE_URL` | The main MANDE site (`mande-frontend`), for links back to it | No (yes in production) | `http://localhost:3010` | `lib/site.ts` |
| `DEV_ORIGINS` | Extra hostnames the dev server answers besides `localhost`, comma-separated (e.g. local names from `../local-proxy`). Only for your own machine | No | none | `next.config.ts` |

`NEXT_PUBLIC_*` values are inlined into the browser bundle at build time, so never put secrets in them, and rebuild after changing them.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server on http://localhost:3020 |
| `npm run build` | Production build (`next build`) |
| `npm run start` | Serves the production build (run `build` first) on port 3000, or `PORT` if set |
| `npm run lint` | Runs ESLint over the project |
