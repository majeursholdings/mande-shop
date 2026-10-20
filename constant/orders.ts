import type { OrderPartStatus, ReturnReason, ReturnStatus } from "@/lib/types/shop";

// ─────────────────────────────────────────────────────────────────────────────
// How an order's progress reads to customers. Mirrors the statuses in
// mande-backend/src/constants/shop.ts (ORDER_PART_STATUSES).
// ─────────────────────────────────────────────────────────────────────────────

export const PART_STATUS_LABELS: Record<OrderPartStatus, string> = {
    awaiting_fulfilment: "Order placed",
    processing: "Being prepared",
    shipped: "On its way",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
};

export const PART_STATUS_TONES: Record<OrderPartStatus, string> = {
    awaiting_fulfilment: "bg-mist-100 text-mist-800",
    processing: "bg-warning-50 text-warning-800",
    shipped: "bg-primary-50 text-primary-800",
    delivered: "bg-primary-100 text-primary-900",
    cancelled: "bg-error-50 text-error-700",
    refunded: "bg-error-50 text-error-700",
};

export const ORDERS_URL = "/account/orders";
export const orderHref = (code: string) => `${ORDERS_URL}/${encodeURIComponent(code)}`;

// ─── Returns (mirrors RETURN_REASONS and RETURN_STATUSES in mande-backend/src/constants/shop.ts) ───

export const RETURN_REASONS: { value: ReturnReason; label: string; hint: string }[] = [
    { value: "changed_mind", label: "I changed my mind", hint: "Refunded as store credit, without the delivery fee." },
    { value: "faulty", label: "It's faulty", hint: "Refunded with its delivery fee." },
    { value: "damaged", label: "It arrived damaged", hint: "Refunded with its delivery fee." },
    { value: "wrong_item", label: "I got the wrong item", hint: "Refunded with its delivery fee." },
    { value: "not_as_described", label: "It's not as described", hint: "Refunded with its delivery fee." },
];

export const RETURN_REASON_LABELS = Object.fromEntries(RETURN_REASONS.map((reason) => [reason.value, reason.label])) as Record<ReturnReason, string>;

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
    requested: "Waiting for the seller",
    approved: "Approved: send it back",
    sent: "On its way back",
    refunded: "Refunded",
    rejected: "Not accepted",
    cancelled: "Withdrawn",
    lapsed: "Closed",
};

export const RETURN_STATUS_TONES: Record<ReturnStatus, string> = {
    requested: "bg-warning-50 text-warning-800",
    approved: "bg-primary-50 text-primary-800",
    sent: "bg-primary-50 text-primary-800",
    refunded: "bg-primary-100 text-primary-900",
    rejected: "bg-error-50 text-error-700",
    cancelled: "bg-mist-100 text-mist-800",
    lapsed: "bg-mist-100 text-mist-800",
};

/** Mirrors RETURN_MAX_PHOTOS. */
export const RETURN_MAX_PHOTOS = 6;

export const RETURNS_URL = "/account/returns";
