"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/customForm";
import type { FormFieldConfig } from "@/components/customForm/types";
import { FormSubmitButton, PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import { Skeleton } from "@/components/ui/skeleton";
import { LOGIN_URL, withNext } from "@/constant/auth";
import { LEGAL_URL, SUPPORT_EMAIL, SUPPORT_HOURS } from "@/constant/legal";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { sendSupportMessage, type SupportSubject } from "@/lib/services/accountService";
import { checkoutService } from "@/lib/services/checkoutService";
import { cn } from "@/lib/utils";

type SupportValues = { subject: string; orderCode: string; message: string };

// ─────────────────────────────────────────────────────────────────────────────
// Help and support: how to reach MANDE (email and hours, for everyone), and,
// signed in, a message to the team about an order, a delivery, a return...
// It goes to the team's inbox from the details on their account, and they
// reply by email. Recent orders are offered to pick from, so the team knows
// which one it's about.
// ─────────────────────────────────────────────────────────────────────────────

const SUBJECTS: { value: SupportSubject; label: string }[] = [
    { value: "order", label: "An order" },
    { value: "delivery", label: "A delivery" },
    { value: "returns", label: "A return or refund" },
    { value: "payment", label: "A payment" },
    { value: "account", label: "My account" },
    { value: "other", label: "Something else" },
];

export default function SupportView() {
    const pathname = usePathname();
    const { customer, isPending } = useCurrentCustomer();

    return (
        <div className="flex flex-col gap-6">
            <ul className="grid gap-3 sm:grid-cols-2">
                <li className="flex gap-3 rounded-xl border border-mist-200 bg-white p-4">
                    <Mail className="mt-0.5 size-5 shrink-0 text-primary-700" aria-hidden />
                    <span className="flex flex-col text-sm">
                        <span className="font-medium text-mist-950">Email us</span>
                        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-secondary-700 hover:underline">
                            {SUPPORT_EMAIL}
                        </a>
                    </span>
                </li>
                <li className="flex gap-3 rounded-xl border border-mist-200 bg-white p-4">
                    <Clock className="mt-0.5 size-5 shrink-0 text-primary-700" aria-hidden />
                    <span className="flex flex-col text-sm">
                        <span className="font-medium text-mist-950">When we&apos;re here</span>
                        <span className="text-mist-700">{SUPPORT_HOURS}</span>
                    </span>
                </li>
            </ul>
            <p className="flex items-center gap-2 text-sm text-mist-700">
                <FileText className="size-4 text-mist-500" aria-hidden />
                Returns, delivery and your rights are set out in our{" "}
                <Link href={LEGAL_URL} className="font-medium text-secondary-700 hover:underline">
                    terms and policies
                </Link>
                .
            </p>

            <section className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-mist-950">Send us a message</h2>
                    <p className="text-sm text-mist-500">We reply by email, usually within one working day.</p>
                </div>
                {isPending ? (
                    <div className="flex flex-col gap-3" aria-hidden>
                        <Skeleton className="h-11 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                ) : customer ? (
                    <MessageForm />
                ) : (
                    <div className="flex flex-col items-start gap-3">
                        <p className="text-sm text-mist-700">Sign in so we know who you are and can look up your orders.</p>
                        <Link href={withNext(LOGIN_URL, pathname)} className={cn(PRIMARY_BUTTON_CLASS, "inline-flex items-center")}>
                            Sign in to send a message
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}

function MessageForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const orders = useQuery({ queryKey: queryKeys.customer.orders(1), queryFn: () => checkoutService.orders(1) });
    const methods = useForm<SupportValues>({ mode: "onTouched", defaultValues: { subject: "", orderCode: "", message: "" } });

    const fields: FormFieldConfig[] = [
        { name: "subject", type: "select", label: "What's it about?", options: SUBJECTS, validation: { required: "Choose what it's about" } },
        {
            name: "orderCode",
            type: "select",
            label: "Which order? (optional)",
            placeholder: orders.data?.orders.length ? "Choose an order" : "No orders yet",
            options: (orders.data?.orders ?? []).map((order) => ({ value: order.code, label: `${order.code}: ${order.sellers.flatMap((part) => part.lines.map((line) => line.title)).join(", ")}`.slice(0, 80) })),
            clearable: true,
            disabled: !orders.data?.orders.length,
        },
        {
            name: "message",
            type: "textarea",
            label: "Your message",
            rows: 5,
            maxLength: 1000,
            placeholder: "Tell us what happened and how we can help.",
            validation: { required: "Write your message", minLength: { value: 10, message: "Tell us a little more" }, maxLength: { value: 1000, message: "Keep it under 1,000 characters" } },
        },
    ];

    const handleSubmit = async (values: SupportValues) => {
        setIsLoading(true);
        try {
            await sendSupportMessage({ subject: values.subject as SupportSubject, message: values.message.trim(), ...(values.orderCode && { orderCode: values.orderCode }) });
            toast.success("Message sent. We'll reply by email.");
            methods.reset();
            setFormKey((key) => key + 1);
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't send your message. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<SupportValues>
            key={formKey}
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            rowPairs={[["subject", "orderCode"]]}
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end">
                    <FormSubmitButton label="Send message" loadingLabel="Sending..." isLoading={isLoading} disabled={!canSubmit} />
                </div>
            )}
        />
    );
}
