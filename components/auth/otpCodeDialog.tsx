"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { TwoFactorMethod } from "@/lib/types/account";
import { maskEmail } from "@/lib/utils";
import OtpCodeForm from "./otpCodeForm";

/**
 * "Enter the code" in a dialog: a sign-in code, verifying the email from the
 * login page, or confirming it's them. `channel` says where the code comes
 * from: their email, or their authenticator app.
 */
export default function OtpCodeDialog({
    open,
    onOpenChange,
    title,
    intro,
    email,
    channel,
    confirmLabel,
    onVerified,
    onResend,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    intro?: ReactNode;
    /** Where an emailed code went. */
    email: string;
    channel: TwoFactorMethod;
    confirmLabel?: string;
    onVerified: (code: string) => void | Promise<void>;
    /** Sends a new emailed code; without it, no "Resend" link. */
    onResend?: () => void | Promise<void>;
}) {
    const sentTo = maskEmail(email);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-100">
                <div className="flex flex-col gap-1">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {intro && <>{intro} </>}
                        {channel === "app" ? (
                            "Enter the 6-digit code from your authenticator app."
                        ) : (
                            <>
                                Enter the 6-digit code we sent to <span className="font-medium text-mist-950">{sentTo}</span>.
                            </>
                        )}
                    </DialogDescription>
                </div>
                <OtpCodeForm
                    resendTo={channel === "email" ? sentTo : undefined}
                    confirmLabel={confirmLabel}
                    onVerified={onVerified}
                    onResend={onResend}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
