"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Mail, Smartphone, type LucideIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import OtpCodeForm from "@/components/auth/otpCodeForm";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { queryKeys } from "@/lib/queryKeys";
import { authService } from "@/lib/services/authService";
import type { Customer, TwoFactorMethod } from "@/lib/types/account";
import { cn, maskEmail } from "@/lib/utils";
import ReauthSteps from "./reauthSteps";

// ─────────────────────────────────────────────────────────────────────────────
// Two-factor authentication: off by default, and their choice. With it on, a
// code is needed as well as the password to sign in: by email, or from an
// authenticator app. Every change needs them to confirm it's them first
// (ReauthSteps); turning on also checks a first code, so a mistyped setup
// can't lock them out.
// ─────────────────────────────────────────────────────────────────────────────

const METHODS: { method: TwoFactorMethod; icon: LucideIcon; title: string; description: (email: string) => string }[] = [
    { method: "email", icon: Mail, title: "Email", description: (email) => `Get a code by email at ${maskEmail(email)}.` },
    { method: "app", icon: Smartphone, title: "Authenticator app", description: () => "Get a code from an app like Google Authenticator or Microsoft Authenticator." },
];

/** What's being changed: turning one method on (and where the setup is), or turning it off. */
type Change =
    | { action: "disable" }
    | { action: "enable"; method: "email"; token: string | null }
    | { action: "enable"; method: "app"; token: string | null; secret: string; otpauthUri: string };

export default function TwoFactorSettings() {
    const queryClient = useQueryClient();
    const { customer } = useCurrentCustomer();
    const [change, setChange] = useState<Change | null>(null);

    if (!customer) {
        return (
            <div className="flex flex-col gap-3" aria-hidden>
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </div>
        );
    }
    const active = customer.twoFactorMethod;

    const applied = (method: TwoFactorMethod | null) => {
        queryClient.setQueryData<Customer | null>(queryKeys.customer.me(), (current) => (current ? { ...current, twoFactorMethod: method } : current));
        setChange(null);
        toast.success(method ? "Two-factor authentication is on." : "Two-factor authentication is off.");
    };

    const close = (open: boolean) => !open && setChange(null);

    return (
        <>
            <ul className="flex flex-col gap-3">
                {METHODS.map(({ method, icon: Icon, title, description }) => {
                    const isActive = active === method;
                    return (
                        <li key={method} className={cn("flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5", isActive ? "border-primary-300" : "border-mist-200")}>
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-700">
                                <Icon className="size-5" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-2 text-sm font-medium text-mist-950">
                                    {title}
                                    {isActive && <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">On</span>}
                                </p>
                                <p className="text-xs text-mist-500">{description(customer.email)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setChange(isActive ? { action: "disable" } : method === "email" ? { action: "enable", method, token: null } : { action: "enable", method, token: null, secret: "", otpauthUri: "" })}
                                className={cn(
                                    "h-9 shrink-0 cursor-pointer rounded-button border px-4 text-sm font-medium transition-colors duration-200",
                                    isActive ? "border-mist-200 text-mist-700 hover:bg-mist-50" : "border-secondary-700 text-secondary-700 hover:bg-secondary-50",
                                )}
                            >
                                {isActive ? "Turn off" : active ? "Switch" : "Set up"}
                            </button>
                        </li>
                    );
                })}
            </ul>

            <Dialog open={change !== null} onOpenChange={close}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    {change?.action === "disable" && (
                        <>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>Turn off two-factor authentication</DialogTitle>
                                <DialogDescription>You&apos;ll sign in with just your password.</DialogDescription>
                            </div>
                            <ReauthSteps
                                email={customer.email}
                                twoFactorMethod={active}
                                action="change_2fa"
                                confirmLabel="Turn off"
                                onConfirmed={async (token) => {
                                    await authService.disableTwoFactor(token);
                                    applied(null);
                                }}
                                onCancel={() => setChange(null)}
                            />
                        </>
                    )}

                    {change?.action === "enable" && (
                        <>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>{change.method === "email" ? "Turn on codes by email" : "Set up an authenticator app"}</DialogTitle>
                                <DialogDescription>
                                    {!change.token
                                        ? "First, confirm it's you."
                                        : change.method === "email"
                                          ? `Enter the 6-digit code we sent to ${maskEmail(customer.email)} to turn it on.`
                                          : "Use an app like Google Authenticator or Microsoft Authenticator."}
                                </DialogDescription>
                            </div>
                            {!change.token ? (
                                <ReauthSteps
                                    email={customer.email}
                                    twoFactorMethod={active}
                                    action="enable_2fa"
                                    confirmLabel="Continue"
                                    onConfirmed={async (token) => {
                                        if (change.method === "email") {
                                            await authService.sendTwoFactorEmailCode(token);
                                            setChange({ action: "enable", method: "email", token });
                                        } else {
                                            const setup = await authService.setupAppTwoFactor(token);
                                            setChange({ action: "enable", method: "app", token, secret: setup.secret, otpauthUri: setup.otpauthUri });
                                        }
                                    }}
                                    onCancel={() => setChange(null)}
                                />
                            ) : change.method === "email" ? (
                                <OtpCodeForm
                                    resendTo={maskEmail(customer.email)}
                                    confirmLabel="Turn on"
                                    onVerified={async (code) => {
                                        await authService.enableTwoFactor("email", code, change.token!);
                                        applied("email");
                                    }}
                                    onResend={() => authService.sendTwoFactorEmailCode(change.token!)}
                                    onCancel={() => setChange(null)}
                                />
                            ) : (
                                <OtpCodeForm
                                    confirmLabel="Turn on"
                                    onVerified={async (code) => {
                                        await authService.enableTwoFactor("app", code, change.token!);
                                        applied("app");
                                    }}
                                    onCancel={() => setChange(null)}
                                >
                                    <AppSetupSteps secret={change.secret} otpauthUri={change.otpauthUri} />
                                </OtpCodeForm>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function AppSetupSteps({ secret, otpauthUri }: { secret: string; otpauthUri: string }) {
    const grouped = secret.match(/.{1,4}/g)?.join(" ") ?? secret;
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(secret);
            toast.success("Setup key copied.");
        } catch {
            toast.error("We couldn't copy the key. Copy it by hand.");
        }
    };
    return (
        <ol className="flex flex-col gap-4 text-sm text-mist-700">
            <li className="flex flex-col gap-3">
                <span>1. Scan this QR code with your authenticator app.</span>
                <div className="mx-auto flex size-40 items-center justify-center rounded-lg border border-mist-200 bg-white p-2">
                    {/* Drawn here: the link holds their secret, so it never goes to another site */}
                    <QRCodeSVG value={otpauthUri} size={144} title="Authenticator QR code" className="size-36" />
                </div>
                <span className="text-xs text-mist-500">Can&apos;t scan it? Enter this key in the app instead:</span>
                <span className="flex items-center justify-between gap-3 rounded-lg bg-mist-50 px-3.5 py-2.5">
                    <code className="font-mono text-sm tracking-wider text-mist-950">{grouped}</code>
                    <button type="button" onClick={copy} aria-label="Copy the setup key" className="flex size-8 cursor-pointer items-center justify-center rounded-md text-mist-600 hover:bg-mist-100">
                        <Copy className="size-4" aria-hidden />
                    </button>
                </span>
            </li>
            <li>2. Enter the 6-digit code the app shows.</li>
        </ol>
    );
}
