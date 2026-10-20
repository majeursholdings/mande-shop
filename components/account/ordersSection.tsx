"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ImageOff, Package } from "lucide-react";
import { LineReview, PartActions } from "@/components/orders/orderActions";
import OrderSummary, { PartStatusBadge, formatOrderDate } from "@/components/orders/orderSummary";
import Pagination from "@/components/products/pagination";
import { PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import { ORDERS_URL, orderHref } from "@/constant/orders";
import { parsePage } from "@/constant/shop";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { formatKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { checkoutService } from "@/lib/services/checkoutService";
import { cn } from "@/lib/utils";
import { AccountPanel, PanelSkeleton } from "./accountShell";

// ─────────────────────────────────────────────────────────────────────────────
// "Your orders": everything they've bought, a page at a time (`?page=`),
// newest first, and one order's page with each seller's progress. Loaded
// once the account is confirmed (the account frame sends anyone else to sign in).
// ─────────────────────────────────────────────────────────────────────────────

export default function OrdersSection() {
    const page = parsePage(useSearchParams().get("page"));
    const { customer } = useCurrentCustomer();
    const query = useQuery({ queryKey: queryKeys.customer.orders(page), queryFn: () => checkoutService.orders(page), enabled: !!customer, placeholderData: (previous) => previous });

    if (query.isPending) return <PanelSkeleton rows={3} />;
    if (query.isError) {
        return (
            <AccountPanel title="Your orders">
                <p className="text-sm text-mist-700">We couldn&apos;t load your orders. Refresh the page to try again.</p>
            </AccountPanel>
        );
    }
    const { orders, total, totalPages } = query.data;

    return (
        <AccountPanel title="Your orders" description={total ? `${total} ${total === 1 ? "order" : "orders"}` : undefined}>
            {orders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-mist-300 px-6 py-10 text-center">
                    <Package className="size-6 text-mist-400" aria-hidden />
                    <p className="font-medium text-mist-950">No orders yet</p>
                    <p className="text-sm text-mist-500">When you buy something, you can follow it here.</p>
                    <Link href="/" className={cn(PRIMARY_BUTTON_CLASS, "mt-2 inline-flex items-center")}>
                        Start shopping
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <ul className="flex flex-col gap-3">
                        {orders.map((order) => {
                            const lines = order.sellers.flatMap((part) => part.lines);
                            const cover = lines.find((line) => line.image)?.image ?? null;
                            return (
                                <li key={order.code}>
                                    <Link href={orderHref(order.code)} className="flex gap-4 rounded-xl border border-mist-200 p-4 transition-colors hover:border-mist-300 hover:bg-mist-50">
                                        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-mist-100">
                                            {cover ? (
                                                <Image src={cover.url} alt="" fill sizes="64px" className="object-cover" />
                                            ) : (
                                                <span className="flex h-full items-center justify-center text-mist-400">
                                                    <ImageOff className="size-5" aria-hidden />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="font-semibold text-mist-950">{order.code}</span>
                                                <span className="text-sm font-semibold text-mist-950">{formatKobo(order.totalKobo)}</span>
                                            </div>
                                            <span className="line-clamp-1 text-sm text-mist-700">{lines.map((line) => `${line.quantity} × ${line.title}`).join(", ")}</span>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs text-mist-500">{formatOrderDate(order.paidAt ?? order.createdAt)}</span>
                                                {order.sellers.map((part) => (
                                                    <PartStatusBadge key={part.id} status={part.status} />
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    <Pagination page={page} totalPages={totalPages} hrefFor={(target) => (target === 1 ? ORDERS_URL : `${ORDERS_URL}?page=${target}`)} />
                </div>
            )}
        </AccountPanel>
    );
}

export function OrderDetailSection({ code }: { code: string }) {
    const { customer } = useCurrentCustomer();
    const query = useQuery({ queryKey: queryKeys.customer.order(code), queryFn: () => checkoutService.order(code), enabled: !!customer, retry: false });

    if (query.isPending) return <PanelSkeleton rows={4} />;
    if (query.isError) {
        return (
            <AccountPanel title="Order not found">
                <p className="text-sm text-mist-700">
                    We couldn&apos;t find that order on your account.{" "}
                    <Link href={ORDERS_URL} className="font-medium text-secondary-700 hover:underline">
                        See your orders
                    </Link>
                </p>
            </AccountPanel>
        );
    }
    const order = query.data;
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <Link href={ORDERS_URL} className="text-sm text-mist-500 hover:text-secondary-700">
                    ← Your orders
                </Link>
                <h1 className="text-xl font-bold text-mist-950">Order {order.code}</h1>
                <p className="text-sm text-mist-500">Placed on {formatOrderDate(order.paidAt ?? order.createdAt)}</p>
            </div>
            <OrderSummary
                order={order}
                partFooter={(part) => <PartActions order={order} part={part} />}
                lineFooter={(part, line) => <LineReview order={order} part={part} line={line} />}
            />
        </div>
    );
}
