import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE, REF_COOKIE_MAX_AGE, REF_PATTERN } from "@/constant/referral";

// ─────────────────────────────────────────────────────────────────────────────
// Referral links (SHOP_IMPLEMENTATION.md 5.7): any shop page opened with
// ?ref=CODE remembers the code and when it was opened in a first-party cookie
// (the last link opened wins), then sends the buyer on to the same page
// without it, so cached pages and shared links stay clean. Checkout sends the
// cookie's code and time; the API decides whether it still counts (the
// shop's attributionDays), so nothing here needs the setting.
// ─────────────────────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
    const ref = request.nextUrl.searchParams.get("ref");
    if (ref === null) return NextResponse.next();
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("ref");
    const response = NextResponse.redirect(clean, 307);
    const code = ref.trim().toUpperCase();
    if (REF_PATTERN.test(code)) {
        response.cookies.set(REF_COOKIE, `${code}.${Date.now()}`, { path: "/", maxAge: REF_COOKIE_MAX_AGE, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
    }
    return response;
}

export const config = {
    // Pages only: not the API routes, Next's files or static assets
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[a-z0-9]+$).*)"],
};
