// ─────────────────────────────────────────────────────────────────────────────
// Signing in on the shop: the code length, how long before a code can be
// sent again (the API allows one a minute), and where the auth pages live.
// ─────────────────────────────────────────────────────────────────────────────

export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 59;

export const LOGIN_URL = "/login";
export const SIGN_UP_URL = "/sign-up";
export const VERIFY_URL = "/verify";
export const FORGOT_PASSWORD_URL = "/forgot-password";
export const ACCOUNT_URL = "/account";

/**
 * Where to go after signing in: `next` when it's a path on the shop (never
 * another site, and never back to an auth page), else the account page.
 */
export function safeNextPath(next: string | null | undefined, fallback = ACCOUNT_URL): string {
    if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
    const path = next.split("?")[0] ?? "";
    if ([LOGIN_URL, SIGN_UP_URL, VERIFY_URL, FORGOT_PASSWORD_URL, "/reset-password"].includes(path)) return fallback;
    return next;
}

/** A link to an auth page that carries `next` along, when there is one. */
export const withNext = (path: string, next: string | null) => (next ? `${path}?next=${encodeURIComponent(next)}` : path);
