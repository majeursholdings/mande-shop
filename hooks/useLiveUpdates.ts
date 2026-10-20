"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLiveState, getServerLiveState, subscribeToLiveUpdates, type LiveState } from "@/lib/live";

/**
 * Keeps the signed-in customer's orders and returns up to date while the
 * component is mounted (lib/live.ts), without a reload. Returns whether
 * it's connected.
 */
export function useLiveUpdates(): LiveState {
    const queryClient = useQueryClient();
    const subscribe = useCallback((onChange: () => void) => subscribeToLiveUpdates(queryClient, onChange), [queryClient]);
    return useSyncExternalStore(subscribe, getLiveState, getServerLiveState);
}
