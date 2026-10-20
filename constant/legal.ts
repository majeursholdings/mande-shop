// ─────────────────────────────────────────────────────────────────────────────
// The legal documents the shop shows, by their Sanity slug. The CMS holds
// every MANDE policy (some only for manufacturers), so the shop lists only
// these, in this order. A document that isn't written yet is simply left out
// until it's published (shop-terms and shop-returns-policy, see
// SHOP_IMPLEMENTATION.md 6.4 and Phase 0).
// ─────────────────────────────────────────────────────────────────────────────

export const SHOP_LEGAL_SLUGS = ["shop-terms", "shop-returns-policy", "terms-and-conditions", "privacy-policy", "cookie-policy"] as const;

export const LEGAL_URL = "/legal";
export const legalHref = (slug: string) => `${LEGAL_URL}/${slug}`;

export const isShopLegalSlug = (slug: string) => (SHOP_LEGAL_SLUGS as readonly string[]).includes(slug);

/** Where to reach MANDE. Mirrors mande-frontend's CONTACT_DETAILS and SUPPORT_HOURS. */
export const SUPPORT_EMAIL = "hello@mande.com.ng";
export const SUPPORT_HOURS = "Monday to Saturday, 8am to 6pm (WAT)";
