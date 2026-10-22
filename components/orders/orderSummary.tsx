import Image from "next/image";
import Link from "next/link";
import { ImageOff, MapPin, Store } from "lucide-react";
import { PART_STATUS_LABELS, PART_STATUS_TONES } from "@/constant/orders";
import { formatKobo } from "@/lib/currency";
import type { CustomerOrder, OrderPart } from "@/lib/types/shop";
import { cn } from "@/lib/utils";

const DATE = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });

export const formatOrderDate = (iso: string) => DATE.format(new Date(iso));

export function PartStatusBadge({ status }: { status: OrderPart["status"] }) {
    return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", PART_STATUS_TONES[status])}>{PART_STATUS_LABELS[status]}</span>;
}

/**
 * An order as the customer bought it: each seller's part with its progress
 * and lines, where it's going, and what was paid (and refunded). Shown on the
 * order page and after checkout.
 */
export default function OrderSummary({
    order,
    partFooter,
    lineFooter,
}: {
    order: CustomerOrder;
    /** What to show under each seller's part (the order page's actions). */
    partFooter?: (part: OrderPart) => React.ReactNode;
    /** What to show under each product line (the order page's "Review this product"). */
    lineFooter?: (part: OrderPart, line: OrderPart["lines"][number]) => React.ReactNode;
}) {
    const items = order.sellers.reduce((sum, part) => sum + part.itemsSubtotalKobo, 0);
    const delivery = order.sellers.reduce((sum, part) => sum + part.deliveryFeeKobo, 0);
    // Card refunds the platform has confirmed; the rest show as on their way
    const cardRefunded = order.refundedKobo - order.refundedToCreditKobo - order.refundPendingKobo;
    const collectingOnly = order.sellers.every((part) => part.lines.every((line) => line.pickup || line.status === "cancelled"));

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
            <div className="flex flex-col gap-4">
                {order.sellers.map((part) => (
                    <section key={part.id} className="rounded-2xl border border-mist-200 bg-white p-4 sm:p-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-mist-100 pb-3">
                            <p className="flex items-center gap-2 text-sm text-mist-500">
                                <Store className="size-4" aria-hidden />
                                Sold by <span className="font-semibold text-mist-950">{part.seller.name}</span>
                            </p>
                            <PartStatusBadge status={part.status} />
                        </div>
                        {part.trackingNote && <p className="mb-3 rounded-lg bg-mist-50 p-3 text-sm text-mist-700">{part.trackingNote}</p>}
                        <ul className="flex flex-col divide-y divide-mist-100">
                            {part.lines.map((line) => (
                                <li key={line.id} className={cn("flex gap-3 py-3 first:pt-0 last:pb-0", line.status === "cancelled" && "opacity-60")}>
                                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-mist-100">
                                        {line.image ? (
                                            <Image src={line.image.url} alt={line.image.alt || line.title} fill sizes="64px" className="object-cover" />
                                        ) : (
                                            <span className="flex h-full items-center justify-center text-mist-400">
                                                <ImageOff className="size-5" aria-hidden />
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        {line.slug ? (
                                            <Link href={`/p/${line.slug}`} className="line-clamp-2 text-sm font-medium text-mist-950 hover:text-primary-700">
                                                {line.title}
                                            </Link>
                                        ) : (
                                            <span className="line-clamp-2 text-sm font-medium text-mist-950">{line.title}</span>
                                        )}
                                        <span className="text-sm text-mist-500">
                                            {line.quantity} × {formatKobo(line.unitPriceKobo)}
                                            {line.pickup ? ", collecting" : ""}
                                        </span>
                                        {line.status === "cancelled" && (
                                            <span className="text-sm font-medium text-error-700">{line.cancelReason ?? "Cancelled"}, and refunded</span>
                                        )}
                                        {lineFooter?.(part, line)}
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold text-mist-950">{formatKobo(line.unitPriceKobo * line.quantity)}</span>
                                </li>
                            ))}
                        </ul>
                        {partFooter?.(part)}
                    </section>
                ))}
            </div>

            <aside className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5">
                <div className="flex flex-col gap-1">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-mist-950">
                        <MapPin className="size-4" aria-hidden />
                        {collectingOnly ? "Collecting" : "Delivering to"}
                    </h2>
                    <address className="flex flex-col text-sm not-italic text-mist-700">
                        <span>{order.delivery.name}</span>
                        {!collectingOnly && (
                            <>
                                <span>{order.delivery.street}</span>
                                <span>
                                    {order.delivery.city}, {order.delivery.state}
                                </span>
                            </>
                        )}
                        <span>{order.delivery.phone}</span>
                    </address>
                </div>
                {order.note && (
                    <div className="flex flex-col gap-1 border-t border-mist-100 pt-4">
                        <h2 className="text-sm font-semibold text-mist-950">Your note for the seller</h2>
                        <p className="whitespace-pre-line text-sm text-mist-700">{order.note}</p>
                    </div>
                )}
                <dl className="flex flex-col gap-2 border-t border-mist-100 pt-4 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-mist-700">Items</dt>
                        <dd className="font-medium text-mist-950">{formatKobo(items)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-mist-700">Delivery</dt>
                        <dd className="font-medium text-mist-950">{delivery === 0 ? "Free" : formatKobo(delivery)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-mist-100 pt-3 text-base">
                        <dt className="font-semibold text-mist-950">{order.paidAt ? "Paid" : "Total"}</dt>
                        <dd className="font-bold text-mist-950">{formatKobo(order.totalKobo)}</dd>
                    </div>
                    {order.creditKobo > 0 && (
                        <div className="flex justify-between text-mist-700">
                            <dt>Of which store credit</dt>
                            <dd className="font-medium">{formatKobo(order.creditKobo)}</dd>
                        </div>
                    )}
                    {cardRefunded > 0 && (
                        <div className="flex justify-between text-error-700">
                            <dt>Refunded to your card</dt>
                            <dd className="font-medium">{formatKobo(cardRefunded)}</dd>
                        </div>
                    )}
                    {order.refundPendingKobo > 0 && (
                        <div className="flex justify-between text-mist-700">
                            <dt>Refund on its way to your card</dt>
                            <dd className="font-medium">{formatKobo(order.refundPendingKobo)}</dd>
                        </div>
                    )}
                    {order.refundedToCreditKobo > 0 && (
                        <div className="flex justify-between text-primary-800">
                            <dt>Refunded as store credit</dt>
                            <dd className="font-medium">{formatKobo(order.refundedToCreditKobo)}</dd>
                        </div>
                    )}
                </dl>
            </aside>
        </div>
    );
}
