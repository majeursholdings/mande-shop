"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SIGN_UP_URL, safeNextPath, withNext } from "@/constant/auth";
import { queryKeys } from "@/lib/queryKeys";
import { authService } from "@/lib/services/authService";
import { maskEmail } from "@/lib/utils";
import OtpCodeForm from "./otpCodeForm";

/**
 * The code from the sign-up email. Verifying signs them in, then they carry
 * on to where they were going (`next`), or their account.
 */
export default function VerifyEmailForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const params = useSearchParams();
    const email = (params.get("email") ?? "").trim().toLowerCase();
    const next = params.get("next");

    if (!email) {
        return (
            <p className="text-sm text-mist-500">
                This link is missing your email.{" "}
                <Link href={withNext(SIGN_UP_URL, next)} className="font-medium text-secondary-700 hover:underline">
                    Start signing up again
                </Link>
                .
            </p>
        );
    }

    const handleVerified = async (code: string) => {
        const result = await authService.verifyEmail(email, code);
        queryClient.setQueryData(queryKeys.customer.me(), result.user);
        toast.success("Your email is verified. Welcome to MANDE Shop!");
        router.replace(safeNextPath(next));
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-mist-500">
                We sent a 6-digit code to <span className="font-medium text-mist-950">{maskEmail(email)}</span>. It lasts 10 minutes.
            </p>
            <OtpCodeForm
                resendTo={maskEmail(email)}
                confirmLabel="Verify email"
                onVerified={handleVerified}
                onResend={() => authService.resendVerification(email)}
                autoFocus
            />
        </div>
    );
}
