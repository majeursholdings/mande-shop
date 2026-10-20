import type { Metadata } from "next";
import { Suspense } from "react";
import AuthCard from "@/components/auth/authCard";
import FormSkeleton from "@/components/auth/formSkeleton";
import ResetPasswordForm from "@/components/auth/resetPasswordForm";

export const metadata: Metadata = { title: "Choose a new password" };

export default function Page() {
    return (
        <AuthCard title="Choose a new password" description="Use at least 8 characters, with upper and lower case letters, a number and a symbol.">
            <Suspense fallback={<FormSkeleton fields={2} />}>
                <ResetPasswordForm />
            </Suspense>
        </AuthCard>
    );
}
