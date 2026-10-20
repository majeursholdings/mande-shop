"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Lock, MapPin, Wallet } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/customForm";
import type { FormFieldConfig } from "@/components/customForm/types";
import { PHONE_PLACEHOLDER, validators } from "@/components/customForm/form.validators";
import { PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LOGIN_URL, withNext } from "@/constant/auth";
import { orderHref } from "@/constant/orders";
import { NIGERIAN_STATES, type NigerianState } from "@/constant/shop";
import { useCart } from "@/hooks/useCart";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { useIsClient } from "@/hooks/useIsClient";
import { MandeApiError, getErrorMessage } from "@/lib/api";
import { removeFromCart, setDeliveryState } from "@/lib/cart";
import { formatKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { accountService } from "@/lib/services/accountService";
import { checkoutService } from "@/lib/services/checkoutService";
import { returnsService } from "@/lib/services/returnsService";
import { shopService } from "@/lib/services/shopService";
import type { Address } from "@/lib/types/account";
import { cn } from "@/lib/utils";

type NewAddressValues = { name: string; phone: string; street: string; city: string; state: string; saveAddress: boolean };

// ─────────────────────────────────────────────────────────────────────────────
// Checkout (SHOP_IMPLEMENTATION.md 6.2): where it's going (a saved address,
// or a new one, saved if they like), the cart priced for that state, and
// "Pay". Paying sends the customer to the payment platform's page; they come
// back to /checkout/complete. The API prices everything again before taking
// payment, and answers CART_CHANGED when something moved since this page
// priced it, so the summary is fetched again and nothing is charged.
//
// Store credit (from returns) goes towards the order when they have some
// (on by default, and they can turn it off). The card pays the rest; when
// the credit covers it all, the order is placed at once and they go
// straight to it.
// ─────────────────────────────────────────────────────────────────────────────

const STATE_OPTIONS = NIGERIAN_STATES.map((state) => ({ label: state === "FCT" ? "FCT (Abuja)" : state, value: state }));
const NEW = "new";
/** Mirrors the API's limit on a checkout note. */
const NOTE_MAX = 500;
/** Mirrors MIN_PAYABLE_KOBO: the least a card can be charged. */
const MIN_CARD_KOBO = 100;

/** How much credit goes on a total (mirrors creditToUse in mande-backend's shop.checkout.ts). */
function creditFor(totalKobo: number, balanceKobo: number): number {
    if (balanceKobo <= 0) return 0;
    if (balanceKobo >= totalKobo) return totalKobo;
    return totalKobo - balanceKobo >= MIN_CARD_KOBO ? balanceKobo : Math.max(0, totalKobo - MIN_CARD_KOBO);
}

export default function CheckoutView() {
    const isClient = useIsClient();
    const router = useRouter();
    const queryClient = useQueryClient();
    const items = useCart();
    const { customer, isPending: customerPending } = useCurrentCustomer();
    const addresses = useQuery({ queryKey: queryKeys.customer.addresses(), queryFn: accountService.addresses, enabled: !!customer });
    // null: not chosen yet, so the default address (or a new one when there are none)
    const [picked, setPicked] = useState<string | null>(null);
    const [paying, setPaying] = useState(false);
    const [note, setNote] = useState("");
    const [useCredit, setUseCredit] = useState(true);
    const credit = useQuery({ queryKey: queryKeys.customer.credit(1), queryFn: () => returnsService.credit(1), enabled: !!customer });
    const methods = useForm<NewAddressValues>({
        mode: "onTouched",
        defaultValues: { name: "", phone: "", street: "", city: "", state: "", saveAddress: true },
    });
    const newState = useWatch({ control: methods.control, name: "state" });

    const saved = addresses.data ?? [];
    const choice = picked ?? (saved.find((address) => address.isDefault)?.id ?? saved[0]?.id ?? NEW);
    const chosen = saved.find((address) => address.id === choice) ?? null;
    const state = (chosen ? chosen.state : newState || null) as NigerianState | null;

    const quote = useQuery({
        queryKey: queryKeys.cart.quote(items, state),
        queryFn: () => shopService.quoteCart(items, state),
        enabled: isClient && items.length > 0,
        placeholderData: (previous) => previous,
    });

    // Checking out needs an account: anyone else signs in first and comes back
    if (!customerPending && !customer) redirect(withNext(LOGIN_URL, "/checkout"));
    if (!isClient || customerPending || (customer && addresses.isPending)) return <CheckoutSkeleton />;

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-mist-200 bg-white px-6 py-16 text-center">
                <p className="text-lg font-semibold text-mist-950">Your cart is empty</p>
                <Link href="/" className={cn(PRIMARY_BUTTON_CLASS, "mt-2 inline-flex items-center")}>
                    Start shopping
                </Link>
            </div>
        );
    }

    const choose = (id: string, address: Address | null) => {
        setPicked(id);
        if (address) setDeliveryState(address.state);
    };

    const pay = async () => {
        if (!quote.data?.canCheckout) return;
        setPaying(true);
        try {
            let request;
            if (chosen) {
                request = { items, note, addressId: chosen.id };
            } else {
                const valid = await methods.trigger();
                if (!valid) {
                    toast.error("Fill in the delivery address first.");
                    return;
                }
                const { saveAddress, ...address } = methods.getValues();
                request = {
                    items,
                    note,
                    address: { name: address.name.trim(), phone: address.phone.trim(), street: address.street.trim(), city: address.city.trim(), state: address.state as NigerianState },
                    saveAddress,
                };
            }
            const { order, checkoutUrl } = await checkoutService.start({ ...request, useCredit: creditKobo > 0 });
            void queryClient.invalidateQueries({ queryKey: queryKeys.customer.creditAll() });
            if (!checkoutUrl) {
                // Paid with store credit: it's an order already
                removeFromCart(...order.sellers.flatMap((part) => part.lines.map((line) => line.productId)));
                void queryClient.invalidateQueries({ queryKey: ["customer", "orders"] });
                toast.success("Order placed, paid with your store credit.");
                router.push(orderHref(order.code));
                return;
            }
            // The payment platform's page: the card never touches MANDE
            window.location.assign(checkoutUrl);
        } catch (error) {
            if (error instanceof MandeApiError && error.code === "CREDIT_CHANGED") {
                await queryClient.invalidateQueries({ queryKey: queryKeys.customer.creditAll() });
                toast.error("Your store credit changed. Check the summary and try again.");
            } else if (error instanceof MandeApiError && error.code === "CART_CHANGED") {
                await queryClient.invalidateQueries({ queryKey: ["cart"] });
                toast.error("Something in your cart changed. Check the summary and try again.");
            } else {
                toast.error(getErrorMessage(error, "We couldn't start your payment. Please try again."));
            }
        } finally {
            setPaying(false);
        }
    };

    const fields: FormFieldConfig[] = [
        { name: "name", type: "text", label: "Who receives it", autoComplete: "name", validation: validators.required("Who receives it") },
        { name: "phone", type: "tel", label: "Their phone number", placeholder: PHONE_PLACEHOLDER, autoComplete: "tel", validation: validators.phone() },
        { name: "street", type: "text", label: "Street address", autoComplete: "street-address", validation: validators.required("The street address") },
        { name: "city", type: "text", label: "City or town", autoComplete: "address-level2", validation: validators.required("The city or town") },
        { name: "state", type: "combobox", label: "State", options: STATE_OPTIONS, emptyMessage: "No state matches", validation: validators.required("The state") },
        { name: "saveAddress", type: "checkbox", label: "Save this address for next time" },
    ];

    const data = quote.data;
    const balanceKobo = credit.data?.balanceKobo ?? 0;
    const creditKobo = useCredit && data?.totalKobo ? creditFor(data.totalKobo, balanceKobo) : 0;
    const toPayKobo = data?.totalKobo ? data.totalKobo - creditKobo : null;
    const problems = data?.sellers.flatMap((part) => part.lines.filter((line) => line.problem)) ?? [];

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
            <section className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5">
                <h2 className="flex items-center gap-2 text-lg font-bold text-mist-950">
                    <MapPin className="size-5 text-primary-700" aria-hidden />
                    Where should it go?
                </h2>
                <div role="radiogroup" aria-label="Delivery address" className="flex flex-col gap-3">
                    {saved.map((address) => (
                        <label
                            key={address.id}
                            className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4", choice === address.id ? "border-secondary-700 bg-secondary-50/40" : "border-mist-200")}
                        >
                            <input type="radio" name="address" checked={choice === address.id} onChange={() => choose(address.id, address)} className="mt-1 size-4 accent-secondary-700" />
                            <span className="flex flex-col text-sm text-mist-700">
                                <span className="font-semibold text-mist-950">{address.label || address.name}</span>
                                <span>
                                    {address.name}, {address.phone}
                                </span>
                                <span>
                                    {address.street}, {address.city}, {address.state === "FCT" ? "FCT (Abuja)" : address.state}
                                </span>
                            </span>
                        </label>
                    ))}
                    <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-4", choice === NEW ? "border-secondary-700 bg-secondary-50/40" : "border-mist-200")}>
                        <input type="radio" name="address" checked={choice === NEW} onChange={() => choose(NEW, null)} className="size-4 accent-secondary-700" />
                        <span className="text-sm font-semibold text-mist-950">{saved.length ? "A new address" : "Enter your address"}</span>
                    </label>
                </div>
                {choice === NEW && (
                    <MainForm<NewAddressValues>
                        methods={methods}
                        fields={fields}
                        onSubmit={pay}
                        rowPairs={[["name", "phone"], ["city", "state"]]}
                        renderFooter={() => null}
                    />
                )}
                <div className="flex flex-col gap-1.5 border-t border-mist-100 pt-4">
                    <label htmlFor="order-note" className="text-sm font-semibold text-mist-950">
                        Note for the seller <span className="font-normal text-mist-500">(optional)</span>
                    </label>
                    <textarea
                        id="order-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX))}
                        rows={3}
                        maxLength={NOTE_MAX}
                        placeholder="Delivery directions, a landmark, the best time to call..."
                        aria-describedby="order-note-count"
                        className="w-full resize-y rounded-button border border-input bg-white px-3 py-2 text-sm text-mist-950 outline-none placeholder:text-mist-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <span id="order-note-count" className="self-end text-xs text-mist-500">
                        {note.length}/{NOTE_MAX}
                    </span>
                </div>
            </section>

            <aside className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5 lg:sticky lg:top-20">
                <h2 className="text-lg font-bold text-mist-950">Your order</h2>
                {!data ? (
                    <div className="flex flex-col gap-3" aria-hidden>
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {data.sellers.flatMap((part) =>
                            part.lines.map((line) => (
                                <li key={line.productId} className="flex gap-3">
                                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-mist-100">
                                        {line.image ? (
                                            <Image src={line.image.url} alt={line.image.alt || line.title} fill sizes="48px" className="object-cover" />
                                        ) : (
                                            <span className="flex h-full items-center justify-center text-mist-400">
                                                <ImageOff className="size-4" aria-hidden />
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col text-sm">
                                        <span className="line-clamp-1 font-medium text-mist-950">{line.title}</span>
                                        <span className="text-mist-500">
                                            {line.quantity} × {formatKobo(line.unitPriceKobo)}
                                            {line.pickup.chosen ? ", collecting" : ""}
                                        </span>
                                        {line.problem && <span className="font-medium text-error-700">Can&apos;t be ordered as it is</span>}
                                    </div>
                                    <span className="text-sm font-semibold text-mist-950">{formatKobo(line.lineTotalKobo)}</span>
                                </li>
                            )),
                        )}
                    </ul>
                )}
                <dl className="flex flex-col gap-2 border-t border-mist-100 pt-4 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-mist-700">Items</dt>
                        <dd className="font-medium text-mist-950">{data ? formatKobo(data.itemsSubtotalKobo) : <Skeleton className="h-5 w-20" />}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-mist-700">Delivery</dt>
                        <dd className="font-medium text-mist-950">
                            {!data ? <Skeleton className="h-5 w-16" /> : data.deliveryFeeKobo === null ? "Choose an address" : data.deliveryFeeKobo === 0 ? "Free" : formatKobo(data.deliveryFeeKobo)}
                        </dd>
                    </div>
                    <div className="flex justify-between border-t border-mist-100 pt-3 text-base">
                        <dt className="font-semibold text-mist-950">Total</dt>
                        <dd className="font-bold text-mist-950">{!data ? <Skeleton className="h-6 w-24" /> : data.totalKobo === null ? "-" : formatKobo(data.totalKobo)}</dd>
                    </div>
                    {creditKobo > 0 && (
                        <>
                            <div className="flex justify-between text-primary-800">
                                <dt>Store credit</dt>
                                <dd className="font-medium">-{formatKobo(creditKobo)}</dd>
                            </div>
                            <div className="flex justify-between text-base">
                                <dt className="font-semibold text-mist-950">To pay</dt>
                                <dd className="font-bold text-mist-950">{formatKobo(toPayKobo ?? 0)}</dd>
                            </div>
                        </>
                    )}
                </dl>
                {balanceKobo > 0 && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary-200 bg-primary-50/50 p-3 text-sm">
                        <input type="checkbox" checked={useCredit} onChange={(event) => setUseCredit(event.target.checked)} className="mt-0.5 size-4 accent-secondary-700" />
                        <span className="flex flex-col">
                            <span className="flex items-center gap-1.5 font-semibold text-mist-950">
                                <Wallet className="size-4 text-primary-700" aria-hidden />
                                Use my store credit
                            </span>
                            <span className="text-mist-600">You have {formatKobo(balanceKobo)}. It never expires.</span>
                        </span>
                    </label>
                )}
                {problems.length > 0 && (
                    <p role="alert" className="text-sm text-error-700">
                        Some items can&apos;t be ordered to this address.{" "}
                        <Link href="/cart" className="font-medium underline">
                            Review your cart
                        </Link>
                    </p>
                )}
                <Button
                    type="button"
                    onClick={pay}
                    disabled={paying || !data?.canCheckout || quote.isFetching}
                    className={cn(PRIMARY_BUTTON_CLASS, "w-full gap-2 disabled:bg-mist-200 disabled:opacity-100")}
                >
                    <Lock className="size-4" aria-hidden />
                    {paying ? (toPayKobo === 0 ? "Placing order..." : "Opening payment...") : toPayKobo === 0 ? "Place order" : toPayKobo ? `Pay ${formatKobo(toPayKobo)}` : "Pay"}
                </Button>
                <p className="text-xs text-mist-500">
                    {toPayKobo === 0
                        ? "Your store credit covers this order, so there's nothing to pay by card."
                        : "You'll pay on our payment partner's secure page, then come back here. Your card details never reach MANDE."}
                </p>
            </aside>
        </div>
    );
}

function CheckoutSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]" aria-hidden>
            <div className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-11 w-full" />
            </div>
        </div>
    );
}
