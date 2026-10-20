import { api } from "@/lib/api";
import type { CreditPage, CustomerReturn, CustomerReturnPage, RefundMethod, ReturnReason } from "@/lib/types/shop";

// ─────────────────────────────────────────────────────────────────────────────
// Returns and store credit (/shop/me/returns, /shop/me/credit). The API
// decides what can go back and where the money goes; a return answers 409
// RETURN_NOT_ALLOWED with a sentence to show when it can't be asked for.
// ─────────────────────────────────────────────────────────────────────────────

export type ReturnRequest = {
    orderCode: string;
    partId: string;
    lines: { lineId: string; quantity: number }[];
    reason: ReturnReason;
    details?: string;
    /** "return-photo" uploads, by publicId. */
    photos: string[];
    refundTo?: RefundMethod;
};

export const returnsService = {
    async list(page: number): Promise<CustomerReturnPage> {
        const { data } = await api.get<CustomerReturnPage>("/shop/me/returns", { params: { page } });
        return data;
    },

    async request(request: ReturnRequest): Promise<CustomerReturn> {
        const { data } = await api.post<{ return: CustomerReturn }>("/shop/me/returns", request);
        return data.return;
    },

    async markSent(code: string, note: string): Promise<CustomerReturn> {
        const { data } = await api.post<{ return: CustomerReturn }>(`/shop/me/returns/${encodeURIComponent(code)}/sent`, note.trim() ? { note: note.trim() } : {});
        return data.return;
    },

    async cancel(code: string): Promise<CustomerReturn> {
        const { data } = await api.post<{ return: CustomerReturn }>(`/shop/me/returns/${encodeURIComponent(code)}/cancel`);
        return data.return;
    },

    async credit(page: number): Promise<CreditPage> {
        const { data } = await api.get<CreditPage>("/shop/me/credit", { params: { page } });
        return data;
    },
};
