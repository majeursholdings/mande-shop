// ─────────────────────────────────────────────────────────────────────────────
// The referral link cookie (SHOP_IMPLEMENTATION.md 5.7): "CODE.openedAtMs",
// set by proxy.ts and read at checkout. It lasts a year; the API only counts
// it within the shop's attributionDays of being opened.
// ─────────────────────────────────────────────────────────────────────────────

export const REF_COOKIE = "mande_ref";
export const REF_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
/** Link and coupon codes share this shape. */
export const REF_PATTERN = /^[A-Z0-9]{4,20}$/;

/** The referral link the buyer last opened, from the cookie, or null. Browser only. */
export function readReferral(): { ref: string; refAt: string } | null {
    if (typeof document === "undefined") return null;
    const raw = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${REF_COOKIE}=`))
        ?.slice(REF_COOKIE.length + 1);
    if (!raw) return null;
    const [code, openedAt] = decodeURIComponent(raw).split(".");
    const at = Number(openedAt);
    if (!code || !REF_PATTERN.test(code) || !Number.isFinite(at) || at <= 0) return null;
    return { ref: code, refAt: new Date(at).toISOString() };
}
