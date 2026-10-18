import axios, { type AxiosError } from "axios";
import { API_BASE_URL } from "@/lib/site";

// ─────────────────────────────────────────────────────────────────────────────
// The browser's client for the API, for the visitor's own data (cart,
// wishlist, account, checkout). Server-rendered catalogue pages don't use it:
// they read through the cached functions in lib/catalogue. Customer sign-in
// (phase 2) adds the access token and the refresh on a 401 here, the way
// mande-frontend's lib/api.ts does.
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

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ErrorBody>) => {
        const body = error.response?.data?.error;
        return Promise.reject(
            new MandeApiError(
                error.response?.status || 500,
                body?.code || (error.code ?? "UNKNOWN_ERROR"),
                body?.message || error.message || "An unexpected error occurred.",
                body?.details,
            ),
        );
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
