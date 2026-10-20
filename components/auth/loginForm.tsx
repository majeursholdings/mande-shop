"use client";

import { useState } from "react";
import Link from "next/link";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import MainForm from "@/components/customForm";
import type { FormFieldConfig } from "@/components/customForm/types";
import { validators } from "@/components/customForm/form.validators";
import { FORGOT_PASSWORD_URL, SIGN_UP_URL, safeNextPath, withNext } from "@/constant/auth";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { MandeApiError, getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { savePendingWishlist } from "@/lib/pendingWishlist";
import { authService } from "@/lib/services/authService";
import { MAIN_SITE_URL } from "@/lib/site";
import type { LoginMfaRequired, LoginSuccess } from "@/lib/types/account";
import OtpCodeDialog from "./otpCodeDialog";

type LoginValues = { email: string; password: string; rememberMe: boolean };
type Credentials = LoginValues;

// ─────────────────────────────────────────────────────────────────────────────
// Signing in on the shop. A code step comes up in a dialog when the account
// has two-factor on (or the API has stepped the login up after wrong
// passwords). An unverified email gets its code here too. An account for
// mande.com.ng (a manufacturer or staff) is told to sign in there instead:
// the API only says so once the password was right.
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const next = useSearchParams().get("next");
    const { customer } = useCurrentCustomer();
    const [isLoading, setIsLoading] = useState(false);
    // The credentials stay with the challenge, so "Resend code" can sign in again for a new code
    const [challenge, setChallenge] = useState<(LoginMfaRequired & { credentials: Credentials }) | null>(null);
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
    const methods = useForm<LoginValues>({ mode: "onTouched", defaultValues: { email: "", password: "", rememberMe: false } });

    // Already signed in: straight on
    if (customer) redirect(safeNextPath(next));

    const fields: FormFieldConfig[] = [
        { name: "email", type: "email", label: "Email", placeholder: "you@example.com", autoComplete: "email", validation: validators.email() },
        {
            name: "password",
            type: "password",
            label: "Password",
            placeholder: "Your password",
            autoComplete: "current-password",
            validation: { required: "Password is required" },
        },
        {
            name: "rememberMe",
            type: "checkbox",
            label: "Keep me signed in",
            trailingSlot: (
                <Link href={withNext(FORGOT_PASSWORD_URL, next)} className="text-sm font-medium text-secondary-700 hover:underline">
                    Forgot password?
                </Link>
            ),
        },
    ];

    const finish = (result: LoginSuccess) => {
        queryClient.setQueryData(queryKeys.customer.me(), result.user);
        setChallenge(null);
        setUnverifiedEmail(null);
        toast.success(`Welcome back${result.user.profile?.firstName ? `, ${result.user.profile.firstName}` : ""}`);
        void savePendingWishlist(queryClient);
        router.replace(safeNextPath(next));
    };

    const signIn = async (credentials: Credentials) => {
        const result = await authService.login(credentials);
        if ("mfaRequired" in result) {
            setChallenge({ ...result, credentials });
            return;
        }
        finish(result);
    };

    const handleSubmit = async ({ email, password, rememberMe }: LoginValues) => {
        setIsLoading(true);
        try {
            await signIn({ email: email.trim().toLowerCase(), password, rememberMe });
        } catch (error) {
            if (error instanceof MandeApiError && error.code === "EMAIL_NOT_VERIFIED") {
                // The API has just emailed a fresh code
                setUnverifiedEmail(email.trim().toLowerCase());
                toast.info(error.message);
                return;
            }
            if (error instanceof MandeApiError && error.code === "USE_MAIN_SITE") {
                toast.error(error.message, { action: { label: "Go to mande.com.ng", onClick: () => window.location.assign(MAIN_SITE_URL) } });
                return;
            }
            toast.error(getErrorMessage(error, "That email or password isn't right."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCode = async (code: string) => {
        if (!challenge) return;
        finish(await authService.loginTwoFactor(challenge.mfaToken, code));
    };

    const handleEmailVerified = async (code: string) => {
        if (!unverifiedEmail) return;
        finish(await authService.verifyEmail(unverifiedEmail, code));
    };

    return (
        <>
            <MainForm<LoginValues> methods={methods} fields={fields} onSubmit={handleSubmit} submitLabel="Sign in" isLoading={isLoading} hideRequiredMarks />

            <p className="mt-6 text-center text-sm text-mist-500">
                New to MANDE Shop?{" "}
                <Link href={withNext(SIGN_UP_URL, next)} className="font-medium text-secondary-700 hover:underline">
                    Create an account
                </Link>
            </p>

            {challenge && (
                <OtpCodeDialog
                    open
                    onOpenChange={(open) => !open && setChallenge(null)}
                    title="Enter your code"
                    intro={challenge.reason === "step_up" ? "To keep your account safe, we need a code as well as your password." : undefined}
                    email={challenge.credentials.email}
                    channel={challenge.method}
                    confirmLabel="Sign in"
                    onVerified={handleCode}
                    onResend={challenge.method === "email" ? () => signIn(challenge.credentials) : undefined}
                />
            )}

            {unverifiedEmail && (
                <OtpCodeDialog
                    open
                    onOpenChange={(open) => !open && setUnverifiedEmail(null)}
                    title="Verify your email"
                    intro="Your email isn't verified yet."
                    email={unverifiedEmail}
                    channel="email"
                    onVerified={handleEmailVerified}
                    onResend={() => authService.resendVerification(unverifiedEmail)}
                />
            )}
        </>
    );
}
