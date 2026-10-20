"use client";

import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import OrderSummary from "@/components/orders/orderSummary";
import { PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LOGIN_URL, withNext } from "@/constant/auth";
import { orderHref } from "@/constant/orders";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { removeFromCart } from "@/lib/cart";
import { queryKeys } from "@/lib/queryKeys";
import { checkoutService } from "@/lib/services/checkoutService";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Back from the payment platform (`?reference=`). The API checks the payment
// with the platform, then this shows how it went: paid (and what they
// bought, which leaves the cart), still waiting (it can take a moment), or
// closed. Opening it again is safe: the payment is only ever applied once.
// ─────────────────────────────────────────────────────────────────────────────

const REFERENCE = /^shp_[a-f\d]{24}$/;

export default function CheckoutComplete() {
    const reference = useSearchParams().get("reference") ?? "";
    const { customer, isPending: customerPending } = useCurrentCustomer();
    const valid = REFERENCE.test(reference);
    const query = useQuery({
        queryKey: queryKeys.customer.checkout(reference),
        queryFn: async () => {
            const order = await checkoutService.confirm(reference);
            // What they paid for leaves the cart (anything added since stays)
            if (order.status === "paid") removeFromCart(...order.sellers.flatMap((part) => part.lines.map((line) => line.productId)));
            return order;
        },
        enabled: !!customer && valid,
        retry: false,
    });

    if (!customerPending && !customer) redirect(withNext(LOGIN_URL, `/checkout/complete?reference=${encodeURIComponent(reference)}`));
    if (!valid) return <Message icon={<XCircle className="size-10 text-error-600" aria-hidden />} title="We couldn't find that payment" text="This link isn't complete. Your orders are in your account." />;
    if (customerPending || query.isPending) return <CompleteSkeleton />;
    if (query.isError) {
        return (
            <Message icon={<Clock className="size-10 text-warning-500" aria-hidden />} title="We couldn't check your payment just now" text="If you paid, your order is safe: we'll confirm it shortly and email you.">
                <Button type="button" onClick={() => query.refetch()} className={cn(PRIMARY_BUTTON_CLASS, "mt-2")}>
                    Check again
                </Button>
            </Message>
        );
    }

    const order = query.data;
    if (order.status === "pending_payment") {
        return (
            <Message
                icon={<Clock className="size-10 text-warning-500" aria-hidden />}
                title="Waiting for your payment"
                text="If you've paid, it can take a moment to come through. We'll email you as soon as it does. If you didn't finish paying, your cart is still here."
            >
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                    <Button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className={PRIMARY_BUTTON_CLASS}>
                        {query.isFetching ? "Checking..." : "Check again"}
                    </Button>
                    <Link href="/cart" className="inline-flex h-11 items-center rounded-button bg-mist-100 px-5 font-medium text-mist-950 hover:bg-mist-200">
                        Back to your cart
                    </Link>
                </div>
            </Message>
        );
    }
    if (order.status !== "paid") {
        return (
            <Message icon={<XCircle className="size-10 text-error-600" aria-hidden />} title="This order didn't go through" text={order.cancelReason ?? "The payment wasn't completed. Nothing has been charged."}>
                <Link href="/cart" className={cn(PRIMARY_BUTTON_CLASS, "mt-2 inline-flex items-center")}>
                    Back to your cart
                </Link>
            </Message>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-mist-200 bg-white px-6 py-10 text-center">
                <CheckCircle2 className="size-10 text-primary-600" aria-hidden />
                <h1 className="text-2xl font-bold text-mist-950">Thank you for your order</h1>
                <p className="text-sm text-mist-500">
                    Order <span className="font-semibold text-mist-950">{order.code}</span> is confirmed. We&apos;ve emailed your receipt, and we&apos;ll tell you when it ships.
                </p>
                <Link href={orderHref(order.code)} className="mt-2 text-sm font-medium text-secondary-700 hover:underline">
                    Follow your order
                </Link>
            </div>
            <OrderSummary order={order} />
        </div>
    );
}

function Message({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-mist-200 bg-white px-6 py-14 text-center">
            {icon}
            <h1 className="text-xl font-bold text-mist-950">{title}</h1>
            <p className="max-w-md text-sm text-mist-500">{text}</p>
            {children}
        </div>
    );
}

export function CompleteSkeleton() {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-mist-200 bg-white px-6 py-14" aria-hidden>
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80" />
        </div>
    );
}
