"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False while rendering on the server and hydrating, true once the page is in the browser (no effect needed). */
export function useIsClient(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
}
