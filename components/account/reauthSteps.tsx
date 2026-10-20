"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import OtpCodeForm from "@/components/auth/otpCodeForm";
import MainForm from "@/components/customForm";
import { FormCancelButton, FormSubmitButton } from "@/components/customForm/formButtons";
import { getErrorMessage } from "@/lib/api";
import { authService } from "@/lib/services/authService";
import type { TwoFactorMethod } from "@/lib/types/account";
import { maskEmail } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// "Confirm it's you" before a sensitive change (two-factor on or off): their
// password, then a code from their authenticator app, or emailed to them
// when they don't use one. Swapped for a 5-minute token the change carries.
// Goes inside the dialog the change was made in, under its title.
// ─────────────────────────────────────────────────────────────────────────────

export default function ReauthSteps({
    email,
    twoFactorMethod,
    action,
    confirmLabel,
    onConfirmed,
    onCancel,
}: {
    email: string;
    twoFactorMethod: TwoFactorMethod | null;
    /** What the emailed code is for (worded in the email). */
    action: string;
    confirmLabel: string;
    /** Runs once both check out: make the change with the token. Throws to show its error. */
    onConfirmed: (reauthToken: string) => Promise<void>;
    onCancel: () => void;
}) {
    const [step, setStep] = useState<"password" | "code">("password");
    const [password, setPassword] = useState("");
    // A code works once: if the change itself fails, trying again reuses the token (good for 5 minutes)
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<{ password: string }>({ defaultValues: { password: "" } });
    const usesApp = twoFactorMethod === "app";
    const sentTo = maskEmail(email);

    const handlePassword = async ({ password: entered }: { password: string }) => {
        setIsLoading(true);
        try {
            if (!usesApp) await authService.sendReauthCode(action);
            setPassword(entered);
            setStep("code");
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't send your code. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCode = async (code: string) => {
        const reauthToken = token ?? (await authService.reauthenticate(password, code));
        setToken(reauthToken);
        await onConfirmed(reauthToken);
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex gap-3 rounded-lg bg-mist-50 px-4 py-3">
                {step === "password" ? <KeyRound className="mt-0.5 size-4 shrink-0 text-mist-500" aria-hidden /> : <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mist-500" aria-hidden />}
                <p className="text-sm text-mist-700">
                    <span className="font-medium text-mist-950">Confirm it&apos;s you, step {step === "password" ? 1 : 2} of 2.</span>{" "}
                    {step === "password" ? (
                        "Enter the password you sign in with."
                    ) : usesApp ? (
                        "Enter the 6-digit code from your authenticator app."
                    ) : (
                        <>
                            Enter the 6-digit code we sent to <span className="font-medium text-mist-950">{sentTo}</span>.
                        </>
                    )}
                </p>
            </div>
            {step === "password" ? (
                <MainForm<{ password: string }>
                    methods={methods}
                    fields={[{ name: "password", type: "password", label: "Password", autoComplete: "current-password", validation: { required: "Enter your password" } }]}
                    onSubmit={handlePassword}
                    isLoading={isLoading}
                    hideRequiredMarks
                    renderFooter={({ isLoading, canSubmit }) => (
                        <div className="flex justify-end gap-3 pt-1">
                            <FormCancelButton onClick={onCancel} disabled={isLoading} />
                            <FormSubmitButton label="Continue" loadingLabel="Checking..." isLoading={isLoading} disabled={!canSubmit} />
                        </div>
                    )}
                />
            ) : (
                <OtpCodeForm
                    resendTo={usesApp ? undefined : sentTo}
                    confirmLabel={confirmLabel}
                    onVerified={handleCode}
                    onResend={() => authService.sendReauthCode(action)}
                    onCancel={onCancel}
                />
            )}
        </div>
    );
}
