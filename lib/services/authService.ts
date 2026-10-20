import { api, setAccessToken } from "@/lib/api";
import type { Customer, LoginMfaRequired, LoginSuccess } from "@/lib/types/account";

// ─────────────────────────────────────────────────────────────────────────────
// Customer sign-up and sign-in, on the API's /shop/auth routes (the shop's
// own refresh cookie). Every call that signs someone in keeps the access
// token in memory (setAccessToken); signing out drops it.
// ─────────────────────────────────────────────────────────────────────────────

export type SignUpPayload = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    acceptedTerms: true;
    marketingOptIn?: boolean;
};

const signedIn = (result: LoginSuccess): LoginSuccess => {
    setAccessToken(result.accessToken);
    return result;
};

export const authService = {
    async register(payload: SignUpPayload): Promise<void> {
        await api.post("/shop/auth/register", payload);
    },

    async verifyEmail(email: string, code: string): Promise<LoginSuccess> {
        const { data } = await api.post<LoginSuccess>("/shop/auth/verify-email", { email, code });
        return signedIn(data);
    },

    async resendVerification(email: string): Promise<void> {
        await api.post("/shop/auth/verify-email/resend", { email });
    },

    async login(payload: { email: string; password: string; rememberMe: boolean }): Promise<LoginSuccess | LoginMfaRequired> {
        const { data } = await api.post<LoginSuccess | LoginMfaRequired>("/shop/auth/login", payload);
        return "accessToken" in data ? signedIn(data) : data;
    },

    async loginTwoFactor(mfaToken: string, code: string): Promise<LoginSuccess> {
        const { data } = await api.post<LoginSuccess>("/shop/auth/login/2fa", { mfaToken, code });
        return signedIn(data);
    },

    async logout(): Promise<void> {
        try {
            await api.post("/shop/auth/logout");
        } finally {
            setAccessToken(null);
        }
    },

    async me(): Promise<Customer> {
        const { data } = await api.get<{ user: Customer }>("/shop/auth/me");
        return data.user;
    },

    async forgotPassword(email: string): Promise<void> {
        await api.post("/shop/auth/password/forgot", { email });
    },

    async resetPassword(token: string, password: string): Promise<void> {
        await api.post("/shop/auth/password/reset", { token, password });
    },

    /** Emails a code for confirming it's them (unless they use an authenticator app). */
    async sendReauthCode(action?: string): Promise<void> {
        await api.post("/shop/auth/reauth/send-code", action ? { action } : {});
    },

    /** Password and code in, a 5-minute token for one sensitive change out. */
    async reauthenticate(password: string, code: string): Promise<string> {
        const { data } = await api.post<{ reauthToken: string }>("/shop/auth/reauth", { password, code });
        return data.reauthToken;
    },

    async changePassword(reauthToken: string, currentPassword: string, newPassword: string): Promise<void> {
        await api.post("/shop/auth/password/change", { currentPassword, newPassword }, { headers: { "X-Reauth-Token": reauthToken } });
    },
};
