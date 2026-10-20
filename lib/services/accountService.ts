import { api } from "@/lib/api";
import type { Address, AddressInput, CustomerProfile } from "@/lib/types/account";

// ─────────────────────────────────────────────────────────────────────────────
// A signed-in customer's own details and saved addresses (/shop/me).
// ─────────────────────────────────────────────────────────────────────────────

export type ProfileChanges = Partial<Pick<CustomerProfile, "firstName" | "lastName" | "phone" | "marketingOptIn">>;

export const accountService = {
    async profile(): Promise<CustomerProfile> {
        const { data } = await api.get<{ profile: CustomerProfile }>("/shop/me/profile");
        return data.profile;
    },

    async updateProfile(changes: ProfileChanges): Promise<CustomerProfile> {
        const { data } = await api.patch<{ profile: CustomerProfile }>("/shop/me/profile", changes);
        return data.profile;
    },

    async addresses(): Promise<Address[]> {
        const { data } = await api.get<{ addresses: Address[] }>("/shop/me/addresses");
        return data.addresses;
    },

    async addAddress(input: AddressInput): Promise<Address[]> {
        const { data } = await api.post<{ addresses: Address[] }>("/shop/me/addresses", input);
        return data.addresses;
    },

    async updateAddress(id: string, input: Partial<AddressInput>): Promise<Address[]> {
        const { data } = await api.patch<{ addresses: Address[] }>(`/shop/me/addresses/${encodeURIComponent(id)}`, input);
        return data.addresses;
    },

    async removeAddress(id: string): Promise<Address[]> {
        const { data } = await api.delete<{ addresses: Address[] }>(`/shop/me/addresses/${encodeURIComponent(id)}`);
        return data.addresses;
    },
};
