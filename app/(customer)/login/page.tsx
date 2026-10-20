import type { Metadata } from "next";
import { Suspense } from "react";
import AuthCard from "@/components/auth/authCard";
import FormSkeleton from "@/components/auth/formSkeleton";
import LoginForm from "@/components/auth/loginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
    return (
        <AuthCard title="Sign in" description="Welcome back. Sign in to see your orders and saved items.">
            <Suspense fallback={<FormSkeleton fields={2} />}>
                <LoginForm />
            </Suspense>
        </AuthCard>
    );
}
