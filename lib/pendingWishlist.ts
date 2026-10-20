import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { shopService } from "@/lib/services/shopService";

// ─────────────────────────────────────────────────────────────────────────────
// A heart tapped while signed out (SHOP_IMPLEMENTATION.md 5.5): the product
// is noted for this tab (sessionStorage), they're sent to sign in, and
// signing in (or verifying a new account) saves it, in that same handler.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = "mande_shop_pending_wishlist";

export function setPendingWishlistSave(productId: string) {
    try {
        window.sessionStorage.setItem(KEY, productId);
    } catch {
        // Storage off: they sign in and tap the heart again
    }
}

function takePendingWishlistSave(): string | null {
    try {
        const productId = window.sessionStorage.getItem(KEY);
        window.sessionStorage.removeItem(KEY);
        return productId && /^[a-f\d]{24}$/i.test(productId) ? productId : null;
    } catch {
        return null;
    }
}

/** After signing in: saves the product they hearted while signed out, if any. Never throws. */
export async function savePendingWishlist(queryClient: QueryClient) {
    const productId = takePendingWishlistSave();
    if (!productId) return;
    try {
        await shopService.saveToWishlist(productId);
        await queryClient.invalidateQueries({ queryKey: queryKeys.customer.wishlistAll() });
        toast.success("Saved to your wishlist.");
    } catch {
        toast.error("We couldn't save that product to your wishlist. Tap the heart to try again.");
    }
}
