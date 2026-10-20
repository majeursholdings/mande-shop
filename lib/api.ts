import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/lib/site";

// ─────────────────────────────────────────────────────────────────────────────
// The browser's client for the API, for the visitor's own data (account,
// cart, wishlist, checkout). Server-rendered catalogue pages don't use it:
// they read through the cached functions in lib/catalogue.
//
// Signing in works the way mande-frontend's does, on the shop's own routes
// (/shop/auth, with the shop's refresh cookie):
//  • The access token lives in memory only, never in storage, so a script
//    injected into the page can't read it. It's short-lived (15 minutes).
//  • The login itself is the refresh token, in an httpOnly cookie scripts
//    can't touch. A reload or a new tab starts with no access token and swaps
//    the cookie for one before its first signed-in call (restoreSession).
//  • A signed-in call turned down with a 401 refreshes once and is sent again.
// ─────────────────────────────────────────────────────────────────────────────

/** An error from the API, in its `{ error: { code, message, details } }` shape. */
export class MandeApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: Record<string, unknown> | Array<unknown>;

    constructor(status: number, code: string, message: string, details?: Record<string, unknown> | Array<unknown>) {
        super(message);
        this.name = "MandeApiError";
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

type ErrorBody = { error?: { code?: string; message?: string; details?: Record<string, unknown> } };

// ─── The access token, and who's listening for it ────────────────────────────

let currentAccessToken: string | null = null;
/** Whether this page has checked the refresh cookie yet: until then, "signed out" isn't known. */
let sessionChecked = false;
const tokenListeners = new Set<() => void>();

/** The access token, if this page has one. */
export function getAccessToken(): string | null {
    return currentAccessToken;
}

export function setAccessToken(token: string | null): void {
    currentAccessToken = token;
    if (token) sessionChecked = true;
    tokenListeners.forEach((listener) => listener());
}

/**
 * For useSyncExternalStore: re-renders when the visitor signs in or out.
 * The snapshot is "signed-in", "signed-out" or "unknown" (not checked yet).
 */
export function subscribeToSession(onChange: () => void): () => void {
    tokenListeners.add(onChange);
    return () => tokenListeners.delete(onChange);
}

export type SessionState = "signed-in" | "signed-out" | "unknown";

export const getSessionState = (): SessionState => (currentAccessToken ? "signed-in" : sessionChecked ? "signed-out" : "unknown");

/** The server can't see the session (the cookie belongs to the API's host). */
export const getServerSessionState = (): SessionState => "unknown";

// ─── The clients ──────────────────────────────────────────────────────────────

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
});

/** For refreshing only, so its own 401s never loop back through the interceptors. */
const refreshClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

/** Calls that work without a login (or are the login): no session to restore first, and no refresh on a 401. */
const isPublicRoute = (url: string) =>
    /^\/?shop\/auth\/(login|register|refresh|logout$|verify-email|password\/(forgot|reset))/.test(url) || /^\/?shop\/products/.test(url);

let sessionRestore: Promise<void> | null = null;

/**
 * Once per page load: swaps the refresh cookie for an access token, so a
 * reload or a new tab stays signed in. Signed out (no cookie) it settles
 * without one; if the API couldn't be reached it's tried again next time.
 */
export function restoreSession(): Promise<void> {
    sessionRestore ??= refreshAccessToken().then(
        () => undefined,
        (error: unknown) => {
            if (!(error as AxiosError)?.response) sessionRestore = null;
        },
    );
    return sessionRestore;
}

let refreshInFlight: Promise<string> | null = null;

async function requestAccessToken(): Promise<string> {
    const ask = async () => {
        const response = await refreshClient.post<{ accessToken: string }>("/shop/auth/refresh");
        if (!response.data?.accessToken) throw new Error("The refresh response had no access token");
        return response.data.accessToken;
    };
    try {
        return await ask();
    } catch (error) {
        // Another tab swapped the same cookie a moment ago, and the browser now holds its new one: ask once more
        if ((error as AxiosError<ErrorBody>)?.response?.data?.error?.code !== "REFRESH_RACE") throw error;
        await new Promise((resolve) => setTimeout(resolve, 300));
        return ask();
    }
}

/**
 * Swaps the refresh cookie for a new access token, and keeps it. Everyone in
 * this tab asking at once shares one request (the API rotates the refresh
 * token on each use). If the API turns it down, the visitor is signed out.
 */
export function refreshAccessToken(): Promise<string> {
    refreshInFlight ??= requestAccessToken()
        .then((token) => {
            setAccessToken(token);
            return token;
        })
        .catch((error: unknown) => {
            const status = (error as AxiosError)?.response?.status;
            if (status === 401 || status === 403) {
                sessionChecked = true;
                setAccessToken(null);
            }
            throw error;
        })
        .finally(() => {
            refreshInFlight = null;
        });
    return refreshInFlight;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined" && !currentAccessToken && !isPublicRoute(config.url ?? "")) await restoreSession();
    if (currentAccessToken && !config.headers.Authorization) config.headers.Authorization = `Bearer ${currentAccessToken}`;
    return config;
});

function normalizeError(error: AxiosError<ErrorBody>): MandeApiError {
    const body = error.response?.data?.error;
    return new MandeApiError(
        error.response?.status || 500,
        body?.code || (error.code ?? "UNKNOWN_ERROR"),
        body?.message || error.message || "An unexpected error occurred.",
        body?.details,
    );
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ErrorBody>) => {
        const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        // A signed-in call whose token ran out: refresh once and send it again
        if (error.response?.status === 401 && original && !original._retry && original.headers?.Authorization && !isPublicRoute(original.url ?? "")) {
            original._retry = true;
            try {
                original.headers.Authorization = `Bearer ${await refreshAccessToken()}`;
                return api(original);
            } catch {
                return Promise.reject(normalizeError(error));
            }
        }
        return Promise.reject(normalizeError(error));
    },
);

/** The message to show for a failed request: the first field error, else the API's message, else `fallback`. */
export function getErrorMessage(err: unknown, fallback = "An error occurred. Please try again."): string {
    if (err instanceof MandeApiError) {
        if (err.details && typeof err.details === "object" && !Array.isArray(err.details)) {
            const [first] = Object.values(err.details);
            if (Array.isArray(first) && first.length > 0) return String(first[0]);
            if (typeof first === "string") return first;
        }
        return err.message || fallback;
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}
