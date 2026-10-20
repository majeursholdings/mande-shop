"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ImageOff, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import { LOGIN_URL, withNext } from "@/constant/auth";
import { useCart, useDeliveryState } from "@/hooks/useCart";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { useIsClient } from "@/hooks/useIsClient";
import { removeFromCart, setCartPickup, setCartQuantity } from "@/lib/cart";
import { formatKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { accountService } from "@/lib/services/accountService";
import { shopService } from "@/lib/services/shopService";
import type { CartLineProblem, CartQuoteLine } from "@/lib/types/shop";
import { cn } from "@/lib/utils";
import StateSelect from "./stateSelect";

// ─────────────────────────────────────────────────────────────────────────────
// The cart (SHOP_IMPLEMENTATION.md 10.2): what's in this browser's cart,
// priced now by the API and grouped by seller, with delivery to the chosen
// state (or the signed-in customer's default address, until they choose).
// Products that no longer exist are dropped from the cart as the price comes
// back; lines that can't be bought say why, and keep checkout closed until
// they're sorted.
// ─────────────────────────────────────────────────────────────────────────────

const PROBLEMS: Record<CartLineProblem, string> = {
    unavailable: "This product isn't on sale any more. Remove it to check out.",
    sold_out: "Sold out. Remove it to check out.",
    not_enough_stock: "Not that many left. Lower the quantity to check out.",
    no_delivery: "Not delivered to this state. Choose collection if it's offered, or remove it.",
    no_pickup: "Collection isn't offered for this product any more.",
};

const CHECKOUT_URL = "/checkout";

export default function CartView() {
    const isClient = useIsClient();
    const items = useCart();
    const chosenState = useDeliveryState();
    const { customer } = useCurrentCustomer();
    const addresses = useQuery({ queryKey: queryKeys.customer.addresses(), queryFn: accountService.addresses, enabled: !!customer && !chosenState });
    const state = chosenState ?? addresses.data?.find((address) => address.isDefault)?.state ?? null;

    const quote = useQuery({
        queryKey: queryKeys.cart.quote(items, state),
        queryFn: async () => {
            const result = await shopService.quoteCart(items, state);
            // Products that are gone for good leave the cart
            if (result.missingProductIds.length) removeFromCart(...result.missingProductIds);
            return result;
        },
        enabled: items.length > 0,
        placeholderData: (previous) => previous,
    });

    // The cart is only in the browser: until then, it isn't known to be empty
    if (!isClient) return <CartSkeleton lines={2} />;

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-mist-200 bg-white px-6 py-16 text-center">
                <ShoppingBag className="size-8 text-mist-400" aria-hidden />
                <p className="text-lg font-semibold text-mist-950">Your cart is empty</p>
                <p className="text-sm text-mist-500">Find something you love, and it&apos;ll wait here for you.</p>
                <Link href="/" className={cn(PRIMARY_BUTTON_CLASS, "mt-2 inline-flex items-center")}>
                    Start shopping
                </Link>
            </div>
        );
    }

    const data = quote.data;
    const checkoutHref = customer ? CHECKOUT_URL : withNext(LOGIN_URL, CHECKOUT_URL);

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
            <div className="flex flex-col gap-4">
                {quote.isError && !data ? (
                    <p role="alert" className="rounded-2xl border border-mist-200 bg-white p-6 text-sm text-mist-700">
                        We couldn&apos;t price your cart just now. Check your connection and refresh the page.
                    </p>
                ) : !data ? (
                    <CartSkeleton lines={items.length} />
                ) : (
                    data.sellers.map((part) => (
                        <section key={part.seller.slug} className="rounded-2xl border border-mist-200 bg-white p-4 sm:p-5">
                            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-mist-100 pb-3">
                                <h2 className="text-sm text-mist-500">
                                    Sold by <span className="font-semibold text-mist-950">{part.seller.name}</span>
                                </h2>
                                <p className="text-sm text-mist-700">
                                    Delivery: {part.deliveryFeeKobo === null ? "choose your state" : part.deliveryFeeKobo === 0 ? "free" : formatKobo(part.deliveryFeeKobo)}
                                </p>
                            </div>
                            <ul className="flex flex-col divide-y divide-mist-100">
                                {part.lines.map((line) => (
                                    <CartLine key={line.productId} line={line} state={state} />
                                ))}
                            </ul>
                        </section>
                    ))
                )}
            </div>

            <aside className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5 lg:sticky lg:top-20">
                <h2 className="text-lg font-bold text-mist-950">Order summary</h2>
                <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-mist-950">Deliver to</span>
                    <StateSelect value={state} />
                </div>
                <dl className="flex flex-col gap-2 border-t border-mist-100 pt-4 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-mist-700">Items</dt>
                        <dd className="font-medium text-mist-950">{data ? formatKobo(data.itemsSubtotalKobo) : <Skeleton className="h-5 w-20" />}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-mist-700">Delivery</dt>
                        <dd className="font-medium text-mist-950">
                            {!data ? <Skeleton className="h-5 w-16" /> : data.deliveryFeeKobo === null ? "Choose your state" : data.deliveryFeeKobo === 0 ? "Free" : formatKobo(data.deliveryFeeKobo)}
                        </dd>
                    </div>
                    <div className="flex justify-between border-t border-mist-100 pt-3 text-base">
                        <dt className="font-semibold text-mist-950">Total</dt>
                        <dd className="font-bold text-mist-950">{!data ? <Skeleton className="h-6 w-24" /> : data.totalKobo === null ? "-" : formatKobo(data.totalKobo)}</dd>
                    </div>
                </dl>
                {data?.canCheckout ? (
                    <Link href={checkoutHref} className={cn(PRIMARY_BUTTON_CLASS, "inline-flex w-full items-center justify-center")}>
                        {customer ? "Check out" : "Sign in to check out"}
                    </Link>
                ) : (
                    <span aria-disabled className={cn(PRIMARY_BUTTON_CLASS, "inline-flex w-full cursor-not-allowed items-center justify-center bg-mist-200 hover:bg-mist-200")}>
                        Check out
                    </span>
                )}
                {data && !data.canCheckout && (
                    <p className="text-xs text-mist-500">{!state ? "Choose the state to deliver to." : "Sort out the items marked in your cart to check out."}</p>
                )}
                <p className="text-xs text-mist-500">Prices and stock are checked again when you check out.</p>
            </aside>
        </div>
    );
}

function CartLine({ line, state }: { line: CartQuoteLine; state: string | null }) {
    const max = line.maxQuantity;
    return (
        <li className="flex gap-3 py-4 first:pt-1 last:pb-1 sm:gap-4">
            <Link href={`/p/${line.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-mist-100 sm:size-24">
                {line.image ? (
                    <Image src={line.image.url} alt={line.image.alt || line.title} fill sizes="96px" className="object-cover" />
                ) : (
                    <span className="flex h-full items-center justify-center text-mist-400">
                        <ImageOff className="size-6" aria-hidden />
                    </span>
                )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <Link href={`/p/${line.slug}`} className="line-clamp-2 text-sm font-medium text-mist-950 hover:text-primary-700">
                            {line.title}
                        </Link>
                        <p className="text-sm text-mist-500">{formatKobo(line.unitPriceKobo)} each</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-mist-950">{formatKobo(line.lineTotalKobo)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-9 items-center rounded-button border border-border" role="group" aria-label={`Quantity of ${line.title}`}>
                        <button
                            type="button"
                            onClick={() => setCartQuantity(line.productId, line.quantity - 1, max)}
                            disabled={line.quantity <= 1}
                            aria-label="One fewer"
                            className="flex size-9 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Minus className="size-3.5" aria-hidden />
                        </button>
                        <span className="min-w-7 text-center text-sm tabular-nums">{line.quantity}</span>
                        <button
                            type="button"
                            onClick={() => setCartQuantity(line.productId, line.quantity + 1, max)}
                            disabled={max !== null && line.quantity >= max}
                            aria-label="One more"
                            className="flex size-9 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Plus className="size-3.5" aria-hidden />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => removeFromCart(line.productId)}
                        className="flex cursor-pointer items-center gap-1 text-sm text-mist-500 hover:text-error-700"
                    >
                        <Trash2 className="size-3.5" aria-hidden />
                        Remove
                    </button>
                </div>

                {line.pickup.available && (
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-mist-700">
                        <input
                            type="checkbox"
                            checked={line.pickup.chosen}
                            onChange={(event) => setCartPickup(line.productId, event.target.checked)}
                            className="mt-0.5 size-4 accent-secondary-700"
                        />
                        <span>Collect it free from {line.pickup.address}</span>
                    </label>
                )}
                {line.delivery && (
                    <p className="text-xs text-mist-500">
                        Delivery to {state}: {line.delivery.feeKobo === 0 ? "free" : formatKobo(line.delivery.feeKobo)}, about {line.delivery.etaDays}{" "}
                        {line.delivery.etaDays === 1 ? "day" : "days"}
                        {line.stock === null && line.leadTimeDays ? ` after it's made (about ${line.leadTimeDays} days)` : ""}
                    </p>
                )}
                {line.problem && (
                    <p role="alert" className="text-sm font-medium text-error-700">
                        {line.problem === "not_enough_stock" && max !== null ? `Only ${max} left. Lower the quantity to check out.` : PROBLEMS[line.problem]}
                    </p>
                )}
            </div>
        </li>
    );
}

function CartSkeleton({ lines }: { lines: number }) {
    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5" aria-hidden>
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: Math.min(lines, 4) }, (_, index) => (
                <div key={index} className="flex gap-4">
                    <Skeleton className="size-24 rounded-lg" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-9 w-32" />
                    </div>
                </div>
            ))}
        </div>
    );
}
