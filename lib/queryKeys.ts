// ─────────────────────────────────────────────────────────────────────────────
// TanStack Query keys for the visitor's own data, in one place so a change
// (signing in, saving an address) refreshes exactly what it should.
// ─────────────────────────────────────────────────────────────────────────────

export const queryKeys = {
    customer: {
        all: ["customer"] as const,
        me: () => ["customer", "me"] as const,
        profile: () => ["customer", "profile"] as const,
        addresses: () => ["customer", "addresses"] as const,
        wishlistIds: () => ["customer", "wishlist", "ids"] as const,
        wishlist: (page: number) => ["customer", "wishlist", "page", page] as const,
        wishlistAll: () => ["customer", "wishlist"] as const,
        orders: (page: number) => ["customer", "orders", "page", page] as const,
        order: (code: string) => ["customer", "orders", "one", code] as const,
        checkout: (reference: string) => ["customer", "checkout", reference] as const,
        reviews: (page: number) => ["customer", "reviews", "mine", page] as const,
        toReview: () => ["customer", "reviews", "to-review"] as const,
        reviewsAll: () => ["customer", "reviews"] as const,
        returns: (page: number) => ["customer", "returns", page] as const,
        returnsAll: () => ["customer", "returns"] as const,
        credit: (page: number) => ["customer", "credit", page] as const,
        creditAll: () => ["customer", "credit"] as const,
        rewards: (page: number) => ["customer", "rewards", page] as const,
    },
    cart: {
        quote: (items: unknown, state: string | null) => ["cart", "quote", items, state] as const,
    },
};
