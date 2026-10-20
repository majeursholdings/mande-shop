import type { NigerianState } from "@/constant/shop";

// ─────────────────────────────────────────────────────────────────────────────
// A customer's account, as the API sends it: the signed-in account from
// /shop/auth (login, verify, me), and their details from /shop/me.
// ─────────────────────────────────────────────────────────────────────────────

export type TwoFactorMethod = "email" | "app";

/** A saved delivery address (GET /shop/me/addresses). */
export type Address = {
    id: string;
    label: string;
    name: string;
    phone: string;
    street: string;
    city: string;
    state: NigerianState;
    isDefault: boolean;
};

export type AddressInput = Omit<Address, "id" | "isDefault"> & { isDefault?: boolean };

/** The signed-in account (the API's PublicUser), with the customer's profile. */
export type Customer = {
    id: string;
    userId: string | null;
    email: string;
    role: "customer";
    status: string;
    emailVerified: boolean;
    twoFactorMethod: TwoFactorMethod | null;
    profile: { firstName: string; lastName: string; phone: string } | null;
};

/** GET /shop/me/profile */
export type CustomerProfile = {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    marketingOptIn: boolean;
    addresses: Address[];
};

export type LoginSuccess = { accessToken: string; accessTokenExpiresAt: string; user: Customer };
export type LoginMfaRequired = { mfaRequired: true; method: TwoFactorMethod; mfaToken: string; reason?: "step_up" };
