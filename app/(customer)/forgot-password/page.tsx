import type { Metadata } from "next";
import { Suspense } from "react";
import AuthCard from "@/components/auth/authCard";
import FormSkeleton from "@/components/auth/formSkeleton";
import ForgotPasswordForm from "@/components/auth/forgotPasswordForm";

export const metadata: Metadata = { title: "Forgot your password?" };

export default function Page() {
    return (
        <AuthCard title="Forgot your password?" description="Enter your email and we'll send you a link to choose a new one.">
            <Suspense fallback={<FormSkeleton fields={1} />}>
                <ForgotPasswordForm />
            </Suspense>
        </AuthCard>
    );
}
