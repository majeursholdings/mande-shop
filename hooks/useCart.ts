"use client";

import { useSyncExternalStore } from "react";
import {
    getCartSnapshot,
    getDeliveryStateSnapshot,
    getServerCartSnapshot,
    getServerDeliveryStateSnapshot,
    subscribeToCart,
} from "@/lib/cart";

/** The cart in this browser (lib/cart.ts). Empty on the server, filled in once the page is in the browser. */
export function useCart() {
    return useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);
}

/** The state chosen for delivery, or null until one is picked. */
export function useDeliveryState() {
    return useSyncExternalStore(subscribeToCart, getDeliveryStateSnapshot, getServerDeliveryStateSnapshot);
}
