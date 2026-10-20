"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { MandeApiError, getAccessToken, getServerSessionState, getSessionState, restoreSession, subscribeToSession } from "@/lib/api";
import { authService } from "@/lib/services/authService";
import { queryKeys } from "@/lib/queryKeys";
import type { Customer } from "@/lib/types/account";

// ─────────────────────────────────────────────────────────────────────────────
// Who's signed in on the shop, for the browser's own components (the header's
// account menu, the account pages). The first ask swaps the refresh cookie
// for an access token (restoreSession), then reads /shop/auth/me; signed out,
// it settles on null without calling /me. A session that ends later (a
// refresh turned down, signing out in this tab) shows as signed out straight
// away, through the session store.
// ─────────────────────────────────────────────────────────────────────────────

/** "signed-in", "signed-out", or "unknown" until the refresh cookie has been checked. */
export function useSessionState() {
    return useSyncExternalStore(subscribeToSession, getSessionState, getServerSessionState);
}

async function loadCustomer(): Promise<Customer | null> {
    if (!getAccessToken()) await restoreSession();
    if (!getAccessToken()) return null;
    try {
        return await authService.me();
    } catch (error) {
        if (error instanceof MandeApiError && (error.status === 401 || error.status === 403)) return null;
        throw error;
    }
}

export function useCurrentCustomer(): { customer: Customer | null; isPending: boolean; isError: boolean } {
    const session = useSessionState();
    const query = useQuery({
        queryKey: queryKeys.customer.me(),
        queryFn: loadCustomer,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
    if (session === "signed-out") return { customer: null, isPending: false, isError: false };
    return { customer: query.data ?? null, isPending: query.isPending, isError: query.isError };
}
