"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import MainForm from "@/components/customForm";
import type { FormFieldConfig } from "@/components/customForm/types";
import { validators } from "@/components/customForm/form.validators";
import { FormSubmitButton } from "@/components/customForm/formButtons";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { accountService, type ProfileChanges } from "@/lib/services/accountService";
import type { CustomerProfile } from "@/lib/types/account";
import { AccountPanel, PanelSkeleton } from "./accountShell";

type DetailsValues = { firstName: string; lastName: string; email: string; phone: string; marketingOptIn: boolean };

// ─────────────────────────────────────────────────────────────────────────────
// "Your details": name, phone and marketing emails. The email is shown but
// can't be changed here (it's how they sign in). Only what changed is sent.
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileSection() {
    const { customer } = useCurrentCustomer();
    // Only once signed in (the account frame sends anyone else to sign in)
    const { data: profile, isPending, isError } = useQuery({ queryKey: queryKeys.customer.profile(), queryFn: accountService.profile, enabled: !!customer });

    if (isPending) return <PanelSkeleton rows={4} />;
    if (isError || !profile) {
        return (
            <AccountPanel title="Your details">
                <p className="text-sm text-mist-700">We couldn&apos;t load your details. Refresh the page to try again.</p>
            </AccountPanel>
        );
    }
    // Saving gives a new profile, which starts the form again from what was saved
    return <DetailsForm key={profile.firstName + profile.lastName + profile.phone + String(profile.marketingOptIn)} profile={profile} />;
}

function DetailsForm({ profile }: { profile: CustomerProfile }) {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<DetailsValues>({
        mode: "onTouched",
        defaultValues: { firstName: profile.firstName, lastName: profile.lastName, email: profile.email, phone: profile.phone, marketingOptIn: profile.marketingOptIn },
    });

    const fields: FormFieldConfig[] = [
        { name: "firstName", type: "text", label: "First name", autoComplete: "given-name", validation: validators.name("First name") },
        { name: "lastName", type: "text", label: "Last name", autoComplete: "family-name", validation: validators.name("Last name") },
        { name: "email", type: "email", label: "Email", readOnly: true, description: "You sign in with this email, so it can't be changed." },
        { name: "phone", type: "tel", label: "Phone number", autoComplete: "tel", validation: validators.phone() },
        { name: "marketingOptIn", type: "checkbox", label: "Send me news and offers from MANDE Shop" },
    ];

    const handleSubmit = async (values: DetailsValues) => {
        const changes: ProfileChanges = {};
        if (values.firstName.trim() !== profile.firstName) changes.firstName = values.firstName.trim();
        if (values.lastName.trim() !== profile.lastName) changes.lastName = values.lastName.trim();
        if (values.phone.trim() !== profile.phone) changes.phone = values.phone.trim();
        if (values.marketingOptIn !== profile.marketingOptIn) changes.marketingOptIn = values.marketingOptIn;
        if (Object.keys(changes).length === 0) {
            toast.info("Nothing has changed.");
            return;
        }
        setIsLoading(true);
        try {
            const saved = await accountService.updateProfile(changes);
            queryClient.setQueryData(queryKeys.customer.profile(), saved);
            await queryClient.invalidateQueries({ queryKey: queryKeys.customer.me() });
            toast.success("Your details are saved.");
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't save your details. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AccountPanel title="Your details" description="How we address you, and how sellers reach you about deliveries.">
            <MainForm<DetailsValues>
                methods={methods}
                fields={fields}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                rowPairs={[["firstName", "lastName"], ["email", "phone"]]}
                renderFooter={({ isLoading, canSubmit }) => (
                    <div className="flex justify-end">
                        <FormSubmitButton label="Save details" loadingLabel="Saving..." isLoading={isLoading} disabled={!canSubmit} />
                    </div>
                )}
            />
        </AccountPanel>
    );
}
