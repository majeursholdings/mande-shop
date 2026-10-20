"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/customForm";
import { validators } from "@/components/customForm/form.validators";
import { FORGOT_PASSWORD_URL, LOGIN_URL } from "@/constant/auth";
import { getErrorMessage } from "@/lib/api";
import { authService } from "@/lib/services/authService";

type ResetValues = { password: string; confirmPassword: string };

/** A new password from the emailed link (`?token=`). Every device is signed out, so they sign in again after. */
export default function ResetPasswordForm() {
    const router = useRouter();
    const token = useSearchParams().get("token") ?? "";
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<ResetValues>({ mode: "onTouched", defaultValues: { password: "", confirmPassword: "" } });

    if (!token) {
        return (
            <p className="text-sm text-mist-500">
                This reset link isn&apos;t complete.{" "}
                <Link href={FORGOT_PASSWORD_URL} className="font-medium text-secondary-700 hover:underline">
                    Ask for a new one
                </Link>
                .
            </p>
        );
    }

    const handleSubmit = async ({ password }: ResetValues) => {
        setIsLoading(true);
        try {
            await authService.resetPassword(token, password);
            toast.success("Your password was reset. Sign in with your new password.");
            router.replace(LOGIN_URL);
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't reset your password. Ask for a new link."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ResetValues>
            methods={methods}
            fields={[
                { name: "password", type: "password", label: "New password", autoComplete: "new-password", validation: validators.password() },
                {
                    name: "confirmPassword",
                    type: "password",
                    label: "Confirm new password",
                    autoComplete: "new-password",
                    validation: validators.confirmPassword(() => methods.getValues()),
                },
            ]}
            onSubmit={handleSubmit}
            submitLabel="Reset password"
            isLoading={isLoading}
        />
    );
}
