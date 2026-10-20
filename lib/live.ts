import { io, type Socket } from "socket.io-client";
import type { QueryClient } from "@tanstack/react-query";
import { getAccessToken, refreshAccessToken, subscribeToSession } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

// ─────────────────────────────────────────────────────────────────────────────
// Live updates for a signed-in customer (SHOP_IMPLEMENTATION.md 6): the API
// nudges their open tabs when one of their orders or returns changes
// ("shop:order-updated", "shop:return-updated"), and the pages showing it
// fetch it again. Nothing is sent from here, and a nudge carries only a code.
//
// One socket for the page, opened while someone is subscribed and signed in
// (subscribeToLiveUpdates, through useLiveUpdates), and closed when they sign
// out or nobody's listening. The API closes it when the access token it
// connected with runs out, and turns a stale one away ("unauthorized"); both
// get a fresh token and connect again, at most every 30 seconds so a refused
// token can't loop.
// ─────────────────────────────────────────────────────────────────────────────

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
const REAUTH_COOLDOWN_MS = 30_000;

export type LiveState = "live" | "offline";

let socket: Socket | null = null;
let state: LiveState = "offline";
let lastReauthAt = 0;
let stopSession: (() => void) | null = null;
const listeners = new Set<() => void>();
const clients = new Set<QueryClient>();

function setState(next: LiveState) {
    if (state === next) return;
    state = next;
    listeners.forEach((listener) => listener());
}

function refetch(keys: readonly (readonly unknown[])[]) {
    for (const client of clients) for (const queryKey of keys) void client.invalidateQueries({ queryKey });
}

async function reconnectWithFreshToken(current: Socket) {
    if (Date.now() - lastReauthAt < REAUTH_COOLDOWN_MS) return;
    lastReauthAt = Date.now();
    try {
        await refreshAccessToken();
        if (current === socket && !current.connected) current.connect();
    } catch {
        // Signed out: the session change closes the socket
    }
}

function open() {
    if (socket || !getAccessToken()) return;
    const current = io(SOCKET_URL, {
        path: "/socket.io",
        auth: (callback) => callback({ token: getAccessToken() }),
        transports: ["websocket", "polling"],
        reconnectionDelay: 2000,
    });
    current.on("connect", () => setState("live"));
    current.on("disconnect", (reason) => {
        setState("offline");
        // The server closed it (the token ran out): Socket.IO won't retry by itself
        if (reason === "io server disconnect") void reconnectWithFreshToken(current);
    });
    current.on("connect_error", (error) => {
        if (error.message === "unauthorized") void reconnectWithFreshToken(current);
    });
    current.on("session:ended", close);
    current.on("shop:order-updated", ({ code }: { code: string }) => refetch([queryKeys.customer.order(code), ["customer", "orders"]]));
    current.on("shop:return-updated", ({ orderCode }: { code: string; orderCode: string }) =>
        refetch([queryKeys.customer.returnsAll(), queryKeys.customer.order(orderCode), queryKeys.customer.creditAll()]),
    );
    socket = current;
}

function close() {
    socket?.disconnect();
    socket = null;
    setState("offline");
}

/**
 * For useSyncExternalStore: keeps the socket open while anyone listens and
 * the customer is signed in, refreshing `queryClient`'s queries on each nudge.
 */
export function subscribeToLiveUpdates(queryClient: QueryClient, onChange: () => void): () => void {
    listeners.add(onChange);
    clients.add(queryClient);
    if (!stopSession) {
        // Signing in opens it; signing out closes it
        stopSession = subscribeToSession(() => (getAccessToken() ? open() : close()));
    }
    open();
    return () => {
        listeners.delete(onChange);
        if (listeners.size > 0) return;
        clients.clear();
        stopSession?.();
        stopSession = null;
        close();
    };
}

export const getLiveState = (): LiveState => state;
export const getServerLiveState = (): LiveState => "offline";
