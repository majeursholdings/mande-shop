import { api } from "@/lib/api";
import type { CartItem } from "@/lib/cart";
import type { NigerianState } from "@/constant/shop";
import type { CartQuote, WishlistPage } from "@/lib/types/shop";

// ─────────────────────────────────────────────────────────────────────────────
// The visitor's own shop data from the browser: their cart priced now, and
// (signed in) their wishlist. Catalogue pages don't use this: they read
// through lib/catalogue on the server.
// ─────────────────────────────────────────────────────────────────────────────

export const shopService = {
    /** `couponCodes`: codes typed at checkout, each matched to its seller (one per seller). */
    async quoteCart(items: CartItem[], state: NigerianState | null, couponCodes: string[] = []): Promise<CartQuote> {
        const { data } = await api.post<CartQuote>("/shop/cart/quote", {
            items: items.map(({ productId, quantity, pickup }) => ({ productId, quantity, ...(pickup && { pickup }) })),
            ...(state && { state }),
            ...(couponCodes.length > 0 && { couponCodes }),
        });
        return data;
    },

    async wishlist(page: number): Promise<WishlistPage> {
        const { data } = await api.get<WishlistPage>("/shop/me/wishlist", { params: { page } });
        return data;
    },

    async wishlistIds(): Promise<string[]> {
        const { data } = await api.get<{ productIds: string[] }>("/shop/me/wishlist/ids");
        return data.productIds;
    },

    async saveToWishlist(productId: string): Promise<void> {
        await api.put(`/shop/me/wishlist/${encodeURIComponent(productId)}`);
    },

    async removeFromWishlist(productId: string): Promise<void> {
        await api.delete(`/shop/me/wishlist/${encodeURIComponent(productId)}`);
    },
};
