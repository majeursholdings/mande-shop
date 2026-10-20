"use client";

import { useState, type ReactNode } from "react";
import { useController, useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/customForm";
import OtpInput from "@/components/customForm/otpInput";
import { FormCancelButton, FormSubmitButton } from "@/components/customForm/formButtons";
import { useCountdown } from "@/hooks/useCountdown";
import { OTP_LENGTH, OTP_RESEND_SECONDS } from "@/constant/auth";
import { getErrorMessage } from "@/lib/api";

type OtpFormValues = { otp: string };

// ─────────────────────────────────────────────────────────────────────────────
// Entering a 6-digit code: verifying the email, a sign-in code, or confirming
// it's them before a sensitive change. A MainForm with the code boxes in its
// footer, and "Resend code" once the countdown runs out (when the code was
// emailed and can be sent again).
// ─────────────────────────────────────────────────────────────────────────────

export default function OtpCodeForm({
    resendTo,
    confirmLabel = "Verify",
    onVerified,
    onResend,
    onCancel,
    autoFocus,
    children,
}: {
    /** Where the code was sent (e.g. a masked email). With onResend, shows the resend link. Omit for authenticator codes. */
    resendTo?: string;
    confirmLabel?: string;
    /** Runs once a full code is entered: it does what the code was for, and throws if the code was wrong. */
    onVerified: (code: string) => void | Promise<void>;
    onResend?: () => void | Promise<void>;
    /** Without it there's no Cancel button (e.g. on the verify page). */
    onCancel?: () => void;
    autoFocus?: boolean;
    children?: ReactNode;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<OtpFormValues>({ defaultValues: { otp: "" } });
    const { field, fieldState } = useController({
        name: "otp",
        control: methods.control,
        rules: {
            required: "Enter the code",
            validate: (value: string) => value.length === OTP_LENGTH || `Enter all ${OTP_LENGTH} digits`,
        },
    });
    const { secondsLeft, restart } = useCountdown(OTP_RESEND_SECONDS);
    const code = field.value ?? "";

    const handleResend = async () => {
        if (secondsLeft > 0 || !onResend) return;
        restart();
        try {
            await onResend();
            toast.success(`A new code is on its way to ${resendTo}`);
        } catch (error) {
            toast.error(getErrorMessage(error, "Couldn't send a new code. Please try again."));
        }
    };

    const handleSubmit = async ({ otp }: OtpFormValues) => {
        setIsLoading(true);
        try {
            await onVerified(otp);
        } catch (error) {
            toast.error(getErrorMessage(error, "That code isn't right, or it has expired."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<OtpFormValues>
            methods={methods}
            fields={[]}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            footerSlot={
                <div className="flex flex-col gap-5">
                    {children}
                    <div className="flex flex-col items-center gap-3">
                        <OtpInput length={OTP_LENGTH} value={code} onChange={field.onChange} error={!!fieldState.error} name={field.name} autoFocus={autoFocus} />
                        {fieldState.error && <span className="text-xs font-text text-error-500">{fieldState.error.message}</span>}
                        {resendTo && onResend && (
                            <p className="text-sm font-text text-mist-500">
                                Didn&apos;t get it?{" "}
                                {secondsLeft > 0 ? (
                                    <span className="text-mist-400">Resend in 0:{secondsLeft.toString().padStart(2, "0")}</span>
                                ) : (
                                    <button type="button" onClick={handleResend} className="cursor-pointer font-medium text-secondary-700 hover:underline">
                                        Resend code
                                    </button>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            }
            renderFooter={({ isLoading }) => (
                <div className="flex justify-end gap-3 pt-1">
                    {onCancel && <FormCancelButton onClick={onCancel} disabled={isLoading} />}
                    <FormSubmitButton
                        label={confirmLabel}
                        loadingLabel="Checking..."
                        isLoading={isLoading}
                        disabled={code.length !== OTP_LENGTH}
                        className={onCancel ? undefined : "w-full"}
                    />
                </div>
            )}
        />
    );
}
