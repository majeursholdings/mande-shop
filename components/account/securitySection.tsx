"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import OtpCodeDialog from "@/components/auth/otpCodeDialog";
import MainForm from "@/components/customForm";
import { validators } from "@/components/customForm/form.validators";
import { FormSubmitButton } from "@/components/customForm/formButtons";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { getErrorMessage } from "@/lib/api";
import { authService } from "@/lib/services/authService";
import { AccountPanel } from "./accountShell";

type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };

// ─────────────────────────────────────────────────────────────────────────────
// Changing the password. The API wants proof it's them first: the current
// password and a fresh code (emailed, or from their authenticator app),
// swapped for a 5-minute token that the change then carries. Their other
// devices are signed out; this one stays in.
// ─────────────────────────────────────────────────────────────────────────────

export default function SecuritySection() {
    const { customer } = useCurrentCustomer();
    const [isLoading, setIsLoading] = useState(false);
    // The passwords wait here while the code is entered
    const [pending, setPending] = useState<PasswordValues | null>(null);
    const methods = useForm<PasswordValues>({ mode: "onTouched", defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
    const channel = customer?.twoFactorMethod === "app" ? "app" : "email";

    const handleSubmit = async (values: PasswordValues) => {
        if (values.currentPassword === values.newPassword) {
            toast.error("Choose a password you haven't just used.");
            return;
        }
        setIsLoading(true);
        try {
            if (channel === "email") await authService.sendReauthCode("change_password");
            setPending(values);
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't send your code. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCode = async (code: string) => {
        if (!pending) return;
        const reauthToken = await authService.reauthenticate(pending.currentPassword, code);
        await authService.changePassword(reauthToken, pending.currentPassword, pending.newPassword);
        toast.success("Password changed. Your other devices have been signed out.");
        setPending(null);
        methods.reset();
    };

    return (
        <AccountPanel title="Security" description="Change your password. You'll confirm it's you with a code.">
            <MainForm<PasswordValues>
                methods={methods}
                fields={[
                    { name: "currentPassword", type: "password", label: "Current password", autoComplete: "current-password", validation: validators.required("Your current password") },
                    { name: "newPassword", type: "password", label: "New password", autoComplete: "new-password", validation: validators.password() },
                    {
                        name: "confirmPassword",
                        type: "password",
                        label: "Confirm new password",
                        autoComplete: "new-password",
                        validation: validators.confirmPassword(() => methods.getValues(), "newPassword"),
                    },
                ]}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                className="max-w-md"
                renderFooter={({ isLoading, canSubmit }) => (
                    <div>
                        <FormSubmitButton label="Change password" loadingLabel="Sending code..." isLoading={isLoading} disabled={!canSubmit} />
                    </div>
                )}
            />

            {pending && customer && (
                <OtpCodeDialog
                    open
                    onOpenChange={(open) => !open && setPending(null)}
                    title="Confirm it's you"
                    email={customer.email}
                    channel={channel}
                    confirmLabel="Change password"
                    onVerified={handleCode}
                    onResend={channel === "email" ? () => authService.sendReauthCode("change_password") : undefined}
                />
            )}
        </AccountPanel>
    );
}
