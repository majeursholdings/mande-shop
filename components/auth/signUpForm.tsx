"use client";

import { useState } from "react";
import Link from "next/link";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/customForm";
import type { FormFieldConfig } from "@/components/customForm/types";
import { PHONE_PLACEHOLDER, validators } from "@/components/customForm/form.validators";
import { LOGIN_URL, VERIFY_URL, safeNextPath, withNext } from "@/constant/auth";
import { legalHref } from "@/constant/legal";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { getErrorMessage } from "@/lib/api";
import { authService } from "@/lib/services/authService";

type SignUpValues = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    acceptedTerms: boolean;
    marketingOptIn: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Creating a shop account. The API answers the same whether or not the email
// is taken (an email already in use gets a message in its inbox instead of a
// code), so this always moves on to entering the code.
// ─────────────────────────────────────────────────────────────────────────────

const legalLink = (slug: string, label: string) => (
    <a href={legalHref(slug)} target="_blank" rel="noopener noreferrer" className="font-medium text-secondary-700 hover:underline">
        {label}
    </a>
);

export default function SignUpForm() {
    const router = useRouter();
    const next = useSearchParams().get("next");
    const { customer } = useCurrentCustomer();
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<SignUpValues>({
        mode: "onTouched",
        defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", acceptedTerms: false, marketingOptIn: false },
    });

    if (customer) redirect(safeNextPath(next));

    const fields: FormFieldConfig[] = [
        { name: "firstName", type: "text", label: "First name", autoComplete: "given-name", validation: validators.name("First name") },
        { name: "lastName", type: "text", label: "Last name", autoComplete: "family-name", validation: validators.name("Last name") },
        { name: "email", type: "email", label: "Email", placeholder: "you@example.com", autoComplete: "email", validation: validators.email() },
        {
            name: "phone",
            type: "tel",
            label: "Phone number",
            placeholder: PHONE_PLACEHOLDER,
            autoComplete: "tel",
            description: "For delivery updates on your orders.",
            validation: validators.phone(),
        },
        { name: "password", type: "password", label: "Password", autoComplete: "new-password", validation: validators.password() },
        {
            name: "confirmPassword",
            type: "password",
            label: "Confirm password",
            autoComplete: "new-password",
            validation: validators.confirmPassword(() => methods.getValues()),
        },
        {
            name: "acceptedTerms",
            type: "checkbox",
            label: (
                <>
                    I agree to the {legalLink("terms-and-conditions", "Terms")} and {legalLink("privacy-policy", "Privacy Policy")}
                </>
            ),
            validation: { validate: (value: boolean) => value === true || "Agree to the Terms and Privacy Policy to sign up" },
        },
        { name: "marketingOptIn", type: "checkbox", label: "Send me news and offers from MANDE Shop" },
    ];

    const handleSubmit = async (values: SignUpValues) => {
        setIsLoading(true);
        try {
            const cleanEmail = values.email.trim().toLowerCase();
            await authService.register({
                email: cleanEmail,
                password: values.password,
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                phone: values.phone.trim(),
                acceptedTerms: true,
                marketingOptIn: values.marketingOptIn,
            });
            const query = new URLSearchParams({ email: cleanEmail, ...(next && { next }) });
            router.push(`${VERIFY_URL}?${query.toString()}`);
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't create your account. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <MainForm<SignUpValues>
                methods={methods}
                fields={fields}
                onSubmit={handleSubmit}
                submitLabel="Create account"
                isLoading={isLoading}
                rowPairs={[["firstName", "lastName"]]}
            />
            <p className="mt-6 text-center text-sm text-mist-500">
                Already have an account?{" "}
                <Link href={withNext(LOGIN_URL, next)} className="font-medium text-secondary-700 hover:underline">
                    Sign in
                </Link>
            </p>
        </>
    );
}
