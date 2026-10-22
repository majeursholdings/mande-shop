/** The page details every shop list sends beside its items (SHOP_IMPLEMENTATION.md 5.6). */
export type PageInfo = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

/** A product as product cards show it, from GET /shop/products. */
export type ProductCardData = {
    id: string;
    slug: string;
    title: string;
    image: { url: string; alt?: string } | null;
    priceKobo: number;
    category: string;
    subcategory: string;
    rating: { average: number; count: number };
    /** null when made to order */
    stock: number | null;
    leadTimeDays: number | null;
    seller: { slug: string; name: string };
};

/** GET /shop/products */
export type ProductPage = PageInfo & { products: ProductCardData[] };

/** One listed product, from GET /shop/products/:slug. */
export type ProductDetail = Omit<ProductCardData, "image" | "seller"> & {
    description: string;
    images: { url: string; alt: string }[];
    listedAt: string | null;
    /** False: returned only with a problem (the seller says so, or it's made to order). */
    changeOfMindReturns: boolean;
    seller: {
        slug: string;
        name: string;
        kind: "manufacturer" | "mande";
        /** Where they're based, e.g. "Lagos"; empty when the seller hasn't said */
        state: string;
        rating: { average: number; count: number };
        /** Every seller with a listed product is verified (identity-checked, or MANDE itself). */
        verified: boolean;
        sellingSince: string | null;
        /** How many products they have on the shop. */
        productCount: number;
    };
};

// ─── Wishlist and cart ────────────────────────────────────────────────────────

/** GET /shop/me/wishlist: one saved product, and whether it can still be bought. */
export type WishlistEntry = {
    savedAt: string;
    available: boolean;
    unavailableReason: "unavailable" | "sold_out" | null;
    product: ProductCardData;
};

export type WishlistPage = PageInfo & { items: WishlistEntry[] };

/** What's wrong with a cart line, if anything (POST /shop/cart/quote). */
export type CartLineProblem = "unavailable" | "sold_out" | "not_enough_stock" | "no_delivery" | "no_pickup";

export type CartQuoteLine = {
    productId: string;
    slug: string;
    title: string;
    image: { url: string; alt?: string } | null;
    unitPriceKobo: number;
    quantity: number;
    stock: number | null;
    leadTimeDays: number | null;
    /** The most that can be ordered now; null for no limit (made to order). */
    maxQuantity: number | null;
    pickup: { chosen: boolean; available: boolean; address: string };
    /** Null when collecting, or when no state is chosen yet. */
    delivery: { feeKobo: number; etaDays: number } | null;
    lineTotalKobo: number;
    problem: CartLineProblem | null;
};

export type CartQuotePart = {
    seller: { slug: string; name: string; kind: "manufacturer" | "mande" };
    lines: CartQuoteLine[];
    itemsSubtotalKobo: number;
    deliveryFeeKobo: number | null;
    totalKobo: number | null;
};

export type CartQuote = {
    state: string | null;
    sellers: CartQuotePart[];
    missingProductIds: string[];
    itemsSubtotalKobo: number;
    deliveryFeeKobo: number | null;
    totalKobo: number | null;
    canCheckout: boolean;
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = "pending_payment" | "paid" | "cancelled" | "expired";
export type OrderPartStatus = "awaiting_fulfilment" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

/** One line of an order, as it was bought. */
export type OrderLine = {
    id: string;
    productId: string;
    slug: string | null;
    title: string;
    image: { url: string; alt?: string } | null;
    unitPriceKobo: number;
    quantity: number;
    deliveryFeeKobo: number;
    pickup: boolean;
    /** "cancelled": it sold out before the payment came in, and was refunded. */
    status: "active" | "cancelled";
    cancelReason: string | null;
    /** Their review of this product (from any order), or null. */
    review: MyReview | null;
    /** False: it can go back only with a problem (no change-of-mind returns). */
    changeOfMindReturns: boolean;
    /** How many aren't in a return yet. */
    returnableQuantity: number;
    /** Made to order by MANDE (SHOP_IMPLEMENTATION.md 5.2.3): "in_production" with an estimated ready date, "ready", or "delayed"; null otherwise. */
    production: { stage: "in_production" | "ready" | "delayed"; readyBy: string | null } | null;
};

/** A review the customer wrote, as their order shows it. */
export type MyReview = { id: string; rating: number; body: string; hidden: boolean };

/** One seller's part of an order: fulfilled on its own. */
export type OrderPart = {
    id: string;
    seller: { slug: string; name: string; kind: "manufacturer" | "mande" };
    status: OrderPartStatus;
    trackingNote: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    itemsSubtotalKobo: number;
    deliveryFeeKobo: number;
    /** Reviewing: open once delivered, until the window closes. */
    review: { open: boolean; until: string | null; seller: MyReview | null };
    /** Before the seller starts on it. */
    canCancel: boolean;
    /** Once it's shipped. */
    canConfirmDelivery: boolean;
    /** Returning: open once delivered, until the return window closes. */
    returns: { open: boolean; until: string | null };
    lines: OrderLine[];
};

/** A customer's own order (GET /shop/me/orders, POST /shop/checkout/confirm). */
export type CustomerOrder = {
    code: string;
    status: OrderStatus;
    createdAt: string;
    paidAt: string | null;
    cancelReason: string | null;
    /** What they wrote for the sellers at checkout. */
    note: string | null;
    delivery: { name: string; phone: string; street: string; city: string; state: string };
    totalKobo: number;
    /** Paid with store credit; the card paid the rest. */
    creditKobo: number;
    refundedKobo: number;
    /** Of what was refunded, what went to their store credit. */
    refundedToCreditKobo: number;
    /** Of what was refunded, card refunds not confirmed yet (still on their way). */
    refundPendingKobo: number;
    sellers: OrderPart[];
};

export type CustomerOrderPage = PageInfo & { orders: CustomerOrder[] };

// ─── Stores ───────────────────────────────────────────────────────────────────

/** A seller's store, from GET /shop/sellers and /shop/sellers/:slug. */
export type Store = {
    slug: string;
    name: string;
    kind: "manufacturer" | "mande";
    state: string;
    avatar: { url: string } | null;
    specialities: string[];
    rating: { average: number; count: number };
    productCount: number;
    joinedAt: string;
};

export type StoreSort = "recommended" | "newest" | "products";

export type StorePage = PageInfo & { sellers: Store[] };

// ─── The product page: suggestions and reviews ───────────────────────────────

/** GET /shop/products/:slug/related */
export type RelatedProducts = {
    /** Cross-sell: from subcategories that go with this one. */
    goesWellWith: ProductCardData[];
    /** Up-sell: the same kind of thing, priced higher, best rated first. */
    upgrades: ProductCardData[];
    fromSeller: ProductCardData[];
    similar: ProductCardData[];
};

export type ReviewSort = "newest" | "highest" | "lowest";

export type ProductReview = {
    id: string;
    rating: number;
    body: string;
    images: { url: string }[];
    /** "Adaeze O.", or "A MANDE customer". */
    author: string;
    verifiedPurchase: boolean;
    createdAt: string;
    editedAt: string | null;
    reply: { body: string; at: string } | null;
};

/** GET /shop/products/:slug/reviews */
export type ProductReviewPage = PageInfo & {
    reviews: ProductReview[];
    breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
    reviewCount: number;
    average: number;
};

// ─── The customer's reviews ───────────────────────────────────────────────────

/** GET /shop/me/reviews: a review they wrote, with what it's about and what happened to it. */
export type WrittenReview = {
    id: string;
    kind: "product" | "seller";
    rating: number;
    body: string;
    images: { url: string }[];
    product: { slug: string; title: string } | null;
    seller: { slug: string; name: string } | null;
    orderCode: string | null;
    status: "published" | "hidden";
    hiddenReason: string | null;
    reply: { body: string; at: string } | null;
    createdAt: string;
    editedAt: string | null;
};

/** GET /shop/me/reviews/to-review: a product or seller from a delivered order, still waiting for their review. */
export type ToReviewItem = {
    orderCode: string;
    partId: string;
    kind: "product" | "seller";
    seller: { slug: string; name: string };
    until: string;
    line: { id: string; title: string; slug: string | null; image: { url: string } | null } | null;
};

// ─── Returns and store credit ─────────────────────────────────────────────────

export type ReturnReason = "changed_mind" | "faulty" | "damaged" | "wrong_item" | "not_as_described";
export type ReturnStatus = "requested" | "approved" | "sent" | "refunded" | "rejected" | "cancelled" | "lapsed";
export type RefundMethod = "credit" | "card";

/** A return, as the customer sees it (GET /shop/me/returns). */
export type CustomerReturn = {
    id: string;
    code: string;
    orderCode: string;
    status: ReturnStatus;
    reason: ReturnReason;
    details: string;
    photos: { url: string }[];
    refundMethod: RefundMethod;
    /** What it refunds: the items, plus their delivery for a problem. */
    amountKobo: number;
    lines: { lineId: string; title: string; image: { url: string; alt?: string } | null; unitPriceKobo: number; quantity: number; deliveryRefundKobo: number }[];
    /** The seller's: where and how to send it back. */
    instructions: string | null;
    rejectReason: string | null;
    sentNote: string | null;
    sendBackBy: string | null;
    createdAt: string;
    approvedAt: string | null;
    sentAt: string | null;
    refundedAt: string | null;
    history: { status: ReturnStatus; at: string; byName: string }[];
    seller: { slug: string; name: string };
    canCancel: boolean;
    canMarkSent: boolean;
};

export type CustomerReturnPage = PageInfo & { returns: CustomerReturn[] };

/** GET /shop/me/credit: the balance and its statement. */
export type CreditEntry = {
    id: string;
    kind: "refund" | "spent" | "released" | "adjustment";
    amountKobo: number;
    balanceAfterKobo: number;
    summary: string;
    orderCode: string | null;
    at: string;
};

export type CreditPage = PageInfo & { balanceKobo: number; entries: CreditEntry[] };
