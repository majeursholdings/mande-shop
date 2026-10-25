import { api } from "@/lib/api";
import type { RewardsPage } from "@/lib/types/shop";

// ─────────────────────────────────────────────────────────────────────────────
// Affiliate rewards (/shop/me/rewards, SHOP_IMPLEMENTATION.md 5.7). The first
// open makes the customer's referral link code.
// ─────────────────────────────────────────────────────────────────────────────

export const rewardsService = {
    async get(page: number): Promise<RewardsPage> {
        const { data } = await api.get<RewardsPage>("/shop/me/rewards", { params: { page } });
        return data;
    },
};
