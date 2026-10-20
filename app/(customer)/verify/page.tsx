import type { Metadata } from "next";
import { Suspense } from "react";
import AuthCard from "@/components/auth/authCard";
import FormSkeleton from "@/components/auth/formSkeleton";
import VerifyEmailForm from "@/components/auth/verifyEmailForm";

export const metadata: Metadata = { title: "Verify your email" };

export default function Page() {
    return (
        <AuthCard title="Verify your email" description="One last step: enter the code from your email.">
            <Suspense fallback={<FormSkeleton fields={1} />}>
                <VerifyEmailForm />
            </Suspense>
        </AuthCard>
    );
}
