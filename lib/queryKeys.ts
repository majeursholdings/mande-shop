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
    },
};
