import type { Metadata } from "next";
import { Suspense } from "react";
import AuthCard from "@/components/auth/authCard";
import FormSkeleton from "@/components/auth/formSkeleton";
import SignUpForm from "@/components/auth/signUpForm";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
    return (
        <AuthCard title="Create your account" description="Shop furniture from MANDE and Nigerian makers, and track every order.">
            <Suspense fallback={<FormSkeleton fields={6} />}>
                <SignUpForm />
            </Suspense>
        </AuthCard>
    );
}
