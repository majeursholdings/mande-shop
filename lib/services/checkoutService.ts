import { api } from "@/lib/api";
import type { CartItem } from "@/lib/cart";
import { readReferral } from "@/constant/referral";
import type { NigerianState } from "@/constant/shop";
import type { CustomerOrder, CustomerOrderPage, PageInfo, ToReviewItem, WrittenReview } from "@/lib/types/shop";

// ─────────────────────────────────────────────────────────────────────────────
// Paying for the cart (/shop/checkout) and the customer's orders
// (/shop/me/orders). Checkout returns the payment platform's page; the
// customer pays there and comes back to /checkout/complete with the
// payment's reference, which `confirm` checks.
// ─────────────────────────────────────────────────────────────────────────────

export type NewAddress = { name: string; phone: string; street: string; city: string; state: NigerianState };

/**
 * The note is for the sellers: delivery directions, a gate code, the best
 * time to call (up to 500 characters). `useCredit` puts their store credit
 * towards it.
 */
export type CheckoutRequest = { items: CartItem[]; note?: string; useCredit?: boolean; couponCodes?: string[] } & ({ addressId: string } | { address: NewAddress; saveAddress: boolean });

export const checkoutService = {
    /** `checkoutUrl` is null when store credit paid for it all: the order is already paid. */
    async start(request: CheckoutRequest): Promise<{ order: CustomerOrder; checkoutUrl: string | null }> {
        const { items, note, useCredit, couponCodes, ...where } = request;
        const { data } = await api.post<{ order: CustomerOrder; checkoutUrl: string | null }>("/shop/checkout", {
            items: items.map(({ productId, quantity, pickup }) => ({ productId, quantity, ...(pickup && { pickup }) })),
            ...where,
            ...(note?.trim() && { note: note.trim() }),
            ...(useCredit && { useCredit: true }),
            ...(couponCodes?.length && { couponCodes }),
            // The referral link they last opened, if any: the API decides whether it counts
            ...readReferral(),
        });
        return data;
    },

    async confirm(reference: string): Promise<CustomerOrder> {
        const { data } = await api.post<{ order: CustomerOrder }>("/shop/checkout/confirm", { reference });
        return data.order;
    },

    async orders(page: number): Promise<CustomerOrderPage> {
        const { data } = await api.get<CustomerOrderPage>("/shop/me/orders", { params: { page } });
        return data;
    },

    async cancelPart(code: string, partId: string): Promise<CustomerOrder> {
        const { data } = await api.post<{ order: CustomerOrder }>(`/shop/me/orders/${encodeURIComponent(code)}/parts/${encodeURIComponent(partId)}/cancel`);
        return data.order;
    },

    async confirmDelivery(code: string, partId: string): Promise<CustomerOrder> {
        const { data } = await api.post<{ order: CustomerOrder }>(`/shop/me/orders/${encodeURIComponent(code)}/parts/${encodeURIComponent(partId)}/confirm-delivery`);
        return data.order;
    },

    async writeReview(review: { orderCode: string; partId: string; kind: "product" | "seller"; lineId?: string; rating: number; body?: string }): Promise<void> {
        await api.post("/shop/me/reviews", review);
    },

    async myReviews(page: number): Promise<PageInfo & { reviews: WrittenReview[] }> {
        const { data } = await api.get<PageInfo & { reviews: WrittenReview[] }>("/shop/me/reviews", { params: { page } });
        return data;
    },

    async toReview(): Promise<ToReviewItem[]> {
        const { data } = await api.get<{ items: ToReviewItem[] }>("/shop/me/reviews/to-review");
        return data.items;
    },

    async editReview(id: string, changes: { rating?: number; body?: string }): Promise<void> {
        await api.patch(`/shop/me/reviews/${encodeURIComponent(id)}`, changes);
    },

    async deleteReview(id: string): Promise<void> {
        await api.delete(`/shop/me/reviews/${encodeURIComponent(id)}`);
    },

    async order(code: string): Promise<CustomerOrder> {
        const { data } = await api.get<{ order: CustomerOrder }>(`/shop/me/orders/${encodeURIComponent(code)}`);
        return data.order;
    },
};
