"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/customForm";
import { validators } from "@/components/customForm/form.validators";
import { LOGIN_URL, withNext } from "@/constant/auth";
import { getErrorMessage } from "@/lib/api";
import { authService } from "@/lib/services/authService";

type ForgotValues = { email: string };

/** Asks for a reset link. The answer is the same whether or not the email has an account. */
export default function ForgotPasswordForm() {
    const next = useSearchParams().get("next");
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<ForgotValues>({ mode: "onTouched", defaultValues: { email: "" } });

    const handleSubmit = async ({ email }: ForgotValues) => {
        setIsLoading(true);
        try {
            const cleanEmail = email.trim().toLowerCase();
            await authService.forgotPassword(cleanEmail);
            setSentTo(cleanEmail);
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't send the link. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    const backToLogin = (
        <p className="mt-6 text-center text-sm text-mist-500">
            Remembered it?{" "}
            <Link href={withNext(LOGIN_URL, next)} className="font-medium text-secondary-700 hover:underline">
                Sign in
            </Link>
        </p>
    );

    if (sentTo) {
        return (
            <>
                <p className="text-sm text-mist-700">
                    If <span className="font-medium text-mist-950">{sentTo}</span> has a MANDE Shop account, a link to reset your password is on its way. It works once, for a
                    short time. Check your spam folder if you don&apos;t see it.
                </p>
                {backToLogin}
            </>
        );
    }

    return (
        <>
            <MainForm<ForgotValues>
                methods={methods}
                fields={[{ name: "email", type: "email", label: "Email", placeholder: "you@example.com", autoComplete: "email", validation: validators.email() }]}
                onSubmit={handleSubmit}
                submitLabel="Send reset link"
                isLoading={isLoading}
                hideRequiredMarks
            />
            {backToLogin}
        </>
    );
}
