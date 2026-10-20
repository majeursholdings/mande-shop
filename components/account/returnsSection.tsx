"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, RotateCcw, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { FormCancelButton, PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import Pagination from "@/components/products/pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDERS_URL, RETURN_REASON_LABELS, RETURN_STATUS_LABELS, RETURN_STATUS_TONES, RETURNS_URL, orderHref } from "@/constant/orders";
import { parsePage } from "@/constant/shop";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { getErrorMessage } from "@/lib/api";
import { formatKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { returnsService } from "@/lib/services/returnsService";
import type { CustomerReturn } from "@/lib/types/shop";
import { cn } from "@/lib/utils";
import { AccountPanel, PanelSkeleton } from "./accountShell";

// ─────────────────────────────────────────────────────────────────────────────
// "Returns & credit" (SHOP_IMPLEMENTATION.md 6.4): their store credit
// balance, and two tabs (`?tab=` in the URL):
//  • Returns: each return, where it is and what's next: how to send it back
//    once approved ("I've sent it", with the courier's details), or
//    withdrawing it before then
//  • Store credit: every naira in and out, a page at a time
// Returns are asked for from an order's page, so the empty state points
// there.
// ─────────────────────────────────────────────────────────────────────────────

const DATE = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
const NOTE_MAX = 300;

export default function ReturnsSection() {
    const params = useSearchParams();
    const { customer } = useCurrentCustomer();
    const tab = params.get("tab") === "credit" ? "credit" : "returns";
    const page = parsePage(params.get("page"));
    const balance = useQuery({ queryKey: queryKeys.customer.credit(1), queryFn: () => returnsService.credit(1), enabled: !!customer });
    const tabClass = (active: boolean) =>
        cn("rounded-button px-3 py-2 text-sm font-medium transition-colors", active ? "bg-secondary-700 text-white" : "text-mist-700 hover:bg-mist-100");

    return (
        <AccountPanel
            title="Returns & credit"
            description="Send something back within 7 days of delivery. Store credit never expires."
            action={
                <div className="flex items-center gap-3 rounded-xl bg-primary-50 px-4 py-2">
                    <Wallet className="size-5 text-primary-700" aria-hidden />
                    <div className="flex flex-col">
                        <span className="text-xs text-mist-600">Store credit</span>
                        {balance.data ? <span className="text-lg font-bold text-mist-950">{formatKobo(balance.data.balanceKobo)}</span> : <Skeleton className="h-6 w-20" />}
                    </div>
                </div>
            }
        >
            <nav aria-label="Returns and credit" className="mb-5 flex gap-2">
                <Link href={RETURNS_URL} aria-current={tab === "returns" ? "page" : undefined} className={tabClass(tab === "returns")}>
                    Returns
                </Link>
                <Link href={`${RETURNS_URL}?tab=credit`} aria-current={tab === "credit" ? "page" : undefined} className={tabClass(tab === "credit")}>
                    Store credit
                </Link>
            </nav>
            {tab === "returns" ? <Returns page={page} /> : <Credit page={page} />}
        </AccountPanel>
    );
}

function Returns({ page }: { page: number }) {
    const { customer } = useCurrentCustomer();
    const query = useQuery({ queryKey: queryKeys.customer.returns(page), queryFn: () => returnsService.list(page), enabled: !!customer });

    if (query.isPending) return <PanelSkeleton rows={2} />;
    if (query.isError) return <p className="text-sm text-mist-700">We couldn&apos;t load your returns. Refresh the page to try again.</p>;
    if (query.data.returns.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-mist-50 px-6 py-10 text-center">
                <RotateCcw className="size-6 text-mist-400" aria-hidden />
                <p className="font-semibold text-mist-950">No returns</p>
                <p className="max-w-sm text-sm text-mist-600">To send something back, open the order and choose &quot;Return items&quot;, within 7 days of delivery.</p>
                <Link href={ORDERS_URL} className="mt-1 text-sm font-medium text-secondary-700 hover:underline">
                    Go to your orders
                </Link>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-4">
                {query.data.returns.map((entry) => (
                    <li key={entry.code}>
                        <ReturnCard entry={entry} />
                    </li>
                ))}
            </ul>
            <Pagination page={page} totalPages={query.data.totalPages} hrefFor={(target) => (target === 1 ? RETURNS_URL : `${RETURNS_URL}?page=${target}`)} />
        </div>
    );
}

function ReturnCard({ entry }: { entry: CustomerReturn }) {
    const queryClient = useQueryClient();
    const [sending, setSending] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);

    const act = async (work: () => Promise<CustomerReturn>, done: string, failed: string) => {
        setBusy(true);
        try {
            await work();
            toast.success(done);
            setSending(false);
            setWithdrawing(false);
        } catch (error) {
            toast.error(getErrorMessage(error, failed));
        } finally {
            setBusy(false);
            void queryClient.invalidateQueries({ queryKey: queryKeys.customer.returnsAll() });
            void queryClient.invalidateQueries({ queryKey: queryKeys.customer.order(entry.orderCode) });
        }
    };

    return (
        <article className="flex flex-col gap-3 rounded-xl border border-mist-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                    <span className="font-semibold text-mist-950">Return {entry.code}</span>
                    <span className="text-xs text-mist-500">
                        {DATE.format(new Date(entry.createdAt))}, order{" "}
                        <Link href={orderHref(entry.orderCode)} className="text-secondary-700 hover:underline">
                            {entry.orderCode}
                        </Link>{" "}
                        from {entry.seller.name}
                    </span>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", RETURN_STATUS_TONES[entry.status])}>{RETURN_STATUS_LABELS[entry.status]}</span>
            </div>

            <ul className="flex flex-col gap-2">
                {entry.lines.map((line) => (
                    <li key={line.lineId} className="flex items-center gap-3 text-sm">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-mist-100">
                            {line.image ? (
                                <Image src={line.image.url} alt="" fill sizes="40px" className="object-cover" />
                            ) : (
                                <span className="flex h-full items-center justify-center text-mist-400">
                                    <ImageOff className="size-4" aria-hidden />
                                </span>
                            )}
                        </div>
                        <span className="flex-1 text-mist-800">
                            {line.quantity} × {line.title}
                        </span>
                    </li>
                ))}
            </ul>

            <p className="text-sm text-mist-700">
                {RETURN_REASON_LABELS[entry.reason]}. Refund: <span className="font-semibold text-mist-950">{formatKobo(entry.amountKobo)}</span>{" "}
                {entry.refundMethod === "credit" ? "as store credit" : "to your card"}.
            </p>

            {entry.status === "approved" && entry.instructions && (
                <div className="flex flex-col gap-1 rounded-lg bg-primary-50 p-3 text-sm">
                    <span className="font-semibold text-mist-950">How to send it back</span>
                    <p className="whitespace-pre-line text-mist-800">{entry.instructions}</p>
                    {entry.sendBackBy && <p className="text-mist-600">Send it by {DATE.format(new Date(entry.sendBackBy))}. The cost of sending it is yours.</p>}
                </div>
            )}
            {entry.status === "sent" && (
                <p className="text-sm text-mist-700">
                    You sent it {entry.sentAt ? DATE.format(new Date(entry.sentAt)) : ""}
                    {entry.sentNote ? ` (${entry.sentNote})` : ""}. The seller refunds it once it&apos;s back and checked.
                </p>
            )}
            {entry.status === "refunded" && entry.refundedAt && <p className="text-sm text-primary-800">Refunded {DATE.format(new Date(entry.refundedAt))}.</p>}
            {entry.status === "rejected" && entry.rejectReason && (
                <p className="text-sm text-error-700">
                    Not accepted: {entry.rejectReason}. If you think that&apos;s wrong,{" "}
                    <Link href="/account/support" className="font-medium underline">
                        contact support
                    </Link>
                    .
                </p>
            )}
            {entry.status === "lapsed" && <p className="text-sm text-mist-600">Closed because it wasn&apos;t sent back in time.</p>}

            {(entry.canMarkSent || entry.canCancel) && !sending && !withdrawing && (
                <div className="flex flex-wrap gap-2 border-t border-mist-100 pt-3">
                    {entry.canMarkSent && (
                        <Button type="button" onClick={() => setSending(true)} className={cn(PRIMARY_BUTTON_CLASS, "h-9 gap-2 text-sm")}>
                            <Truck className="size-4" aria-hidden />
                            I&apos;ve sent it
                        </Button>
                    )}
                    {entry.canCancel && (
                        <Button type="button" variant="outline" onClick={() => setWithdrawing(true)} className="h-9 rounded-button text-sm text-error-700">
                            Withdraw return
                        </Button>
                    )}
                </div>
            )}
            {sending && (
                <form
                    className="flex flex-col gap-2 border-t border-mist-100 pt-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void act(() => returnsService.markSent(entry.code, note), "Thanks. The seller will refund it once it's back.", "We couldn't save that. Please try again.");
                    }}
                >
                    <label htmlFor={`sent-${entry.code}`} className="text-sm font-medium text-mist-950">
                        How did you send it? <span className="font-normal text-mist-500">(optional)</span>
                    </label>
                    <textarea
                        id={`sent-${entry.code}`}
                        value={note}
                        onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX))}
                        rows={2}
                        maxLength={NOTE_MAX}
                        placeholder="The courier and tracking number, or who dropped it off"
                        className="w-full resize-y rounded-button border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <div className="flex gap-2">
                        <Button type="submit" disabled={busy} className={cn(PRIMARY_BUTTON_CLASS, "h-9 text-sm")}>
                            {busy ? "Saving..." : "Confirm it's sent"}
                        </Button>
                        <FormCancelButton onClick={() => setSending(false)} disabled={busy} />
                    </div>
                </form>
            )}
            {withdrawing && (
                <div className="flex flex-col gap-2 rounded-lg bg-error-50 p-3 text-sm">
                    <p className="text-error-800">Withdraw this return? You can ask again while the return window is open.</p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={() => act(() => returnsService.cancel(entry.code), "Return withdrawn.", "We couldn't withdraw it. It may have moved on.")}
                            className="h-9 rounded-button bg-error-600 text-sm text-white hover:bg-error-700"
                        >
                            {busy ? "Withdrawing..." : "Yes, withdraw it"}
                        </Button>
                        <FormCancelButton onClick={() => setWithdrawing(false)} disabled={busy}>
                            Keep it
                        </FormCancelButton>
                    </div>
                </div>
            )}
        </article>
    );
}

function Credit({ page }: { page: number }) {
    const { customer } = useCurrentCustomer();
    const query = useQuery({ queryKey: queryKeys.customer.credit(page), queryFn: () => returnsService.credit(page), enabled: !!customer });

    if (query.isPending) return <PanelSkeleton rows={3} />;
    if (query.isError) return <p className="text-sm text-mist-700">We couldn&apos;t load your store credit. Refresh the page to try again.</p>;
    if (query.data.entries.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-mist-50 px-6 py-10 text-center">
                <Wallet className="size-6 text-mist-400" aria-hidden />
                <p className="font-semibold text-mist-950">No store credit yet</p>
                <p className="max-w-sm text-sm text-mist-600">Refunds for returns you changed your mind about come back here, to spend on anything on MANDE Shop.</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-4">
            <ul className="flex flex-col divide-y divide-mist-100">
                {query.data.entries.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div className="flex min-w-0 flex-col">
                            <span className="text-mist-950">{entry.summary}</span>
                            <span className="text-xs text-mist-500">
                                {DATE.format(new Date(entry.at))}
                                {entry.orderCode && (
                                    <>
                                        {", "}
                                        <Link href={orderHref(entry.orderCode)} className="text-secondary-700 hover:underline">
                                            {entry.orderCode}
                                        </Link>
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="flex shrink-0 flex-col items-end">
                            <span className={cn("font-semibold", entry.amountKobo > 0 ? "text-primary-800" : "text-mist-950")}>
                                {entry.amountKobo > 0 ? "+" : "-"}
                                {formatKobo(Math.abs(entry.amountKobo))}
                            </span>
                            <span className="text-xs text-mist-500">Balance {formatKobo(entry.balanceAfterKobo)}</span>
                        </div>
                    </li>
                ))}
            </ul>
            <Pagination page={page} totalPages={query.data.totalPages} hrefFor={(target) => `${RETURNS_URL}?tab=credit${target === 1 ? "" : `&page=${target}`}`} />
        </div>
    );
}
