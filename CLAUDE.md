@AGENTS.md

# Project conventions

The shop (`shop.mande.com.ng`) is for customers only. The plan is `../SHOP_IMPLEMENTATION.md`; read the relevant section before building a feature.

- Never use the em dash ("—") in copy, meaning any text a user reads: UI labels and messages, toasts, pages, emails, CMS content. Use a comma, full stop, colon or brackets instead (or split the sentence). This applies to new copy and to copy you touch.
- Every form submit handler wraps its work in `try`/`catch` (plus `finally` to reset loading state when there is one) and shows a user-facing `toast.error(...)` in the `catch`, so failures are handled on the frontend instead of throwing silently.
- **Never use `useEffect`** (or `useLayoutEffect`) in new or changed code, for anything. Use the alternative that fits: derive values during render; do the work in the event handler that causes it (a click, a submit, a mutation's `onSuccess`, a query's `queryFn`); read browser state through `useSyncExternalStore` with a server snapshot; reset a component's state by remounting it (a `key`, or rendering it only while open); run third-party scripts with `next/script`. If something truly seems to need an effect, stop and ask first.
- Loading state for anything loaded from the server is a skeleton: a `bg-gray-300` block (use the shared `Skeleton` from `@/components/ui/skeleton`) sized like the value it stands in for. Only the server data itself (prices, names, ratings, product cards, images) is skeletoned; hardcoded copy (headings, labels, buttons) renders straight away. No full-page spinners or "Loading..." text. This includes every `<Suspense>` fallback.
- No sample, mock or placeholder data in the app: no fallback to fake records when the API is empty, errors or is loading. Show the skeleton while loading, an empty state when there's nothing, and an error message when it fails.
- Same look as `mande-frontend`: Inter, the theme tokens in `app/globals.css`, and the shadcn components in `components/ui/` (`base-nova`). Use the theme colours (`primary`, `muted`, `primary-700`...), not new hex values. When a component exists in `mande-frontend/components/ui/`, copy it from there rather than generating a new one.

# Rendering (Cache Components is on)

- Public catalogue pages (home, category, subcategory, product, seller, reviews, legal) render on the server. Their API reads are functions with `"use cache"`, a `cacheLife` and a `cacheTag` (`product:<slug>`, `seller:<slug>`, `category:<slug>`), in `lib/catalogue/`.
- **Server-rendered pages never depend on who is visiting.** No `cookies()`, no signed-in API calls. Anything about the visitor (cart count, account menu, wishlist heart, live stock, delivery fee for the chosen state, "Write a review") is a small client component inside the page.
- Anything that reads `searchParams` (page, sort, filters, search query) sits inside `<Suspense>` with a skeleton fallback, and passes the values into a cached function so each combination is cached separately.
- Cart, checkout, wishlist, account and auth pages are client components using TanStack Query and axios, and are `noindex`.

# Data

- Lists are always paginated by the API (`page`, `limit` up to 48). The response is keyed by what it holds, beside the page details: `{ products: [...], page, limit, total, totalPages }`. Never fetch a whole list and slice or filter it in the browser. Page, sort and filters live in the URL (`?page=2&sort=price-asc`), so pages can be shared and crawled. No "Load more".
- Money comes from the API in whole kobo. Convert to naira only when displaying it.
- Shared constants (statuses, `SHOP_CATEGORIES`, `NIGERIAN_STATES`) live in `constant/shop.ts` and mirror `mande-backend/src/constants/shop.ts`. Change both together.
- Images use `next/image`; product images come from `res.cloudinary.com`.
