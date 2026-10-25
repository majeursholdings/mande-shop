"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Copy, Gift, Ticket } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/products/pagination";
import { orderHref } from "@/constant/orders";
import { parsePage } from "@/constant/shop";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { formatKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { rewardsService } from "@/lib/services/rewardsService";
import type { PersonalCoupon, RewardsEntry, RewardsPage } from "@/lib/types/shop";
import { cn } from "@/lib/utils";
import { AccountPanel, PanelSkeleton } from "./accountShell";

// ─────────────────────────────────────────────────────────────────────────────
// Rewards (SHOP_IMPLEMENTATION.md 5.7): the customer's referral link and any
// personal coupons, to copy or share; their affiliate credit, shown as points
// (1 point = ₦1), available and pending; how it works with the numbers in
// force; and their statement, a page at a time. Credit is earned on MANDE
// stock only, and the buyer is never told who referred them.
// ─────────────────────────────────────────────────────────────────────────────

const REWARDS_URL = "/account/rewards";
const DATE = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
const POINTS = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

/** Points are whole naira, rounded down. */
const points = (kobo: number) => `${kobo < 0 ? "-" : ""}${POINTS.format(Math.floor(Math.abs(kobo) / 100))}`;

async function copy(text: string, what: string) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success(`${what} copied`);
    } catch {
        toast.error(`We couldn't copy the ${what.toLowerCase()}. Select it and copy it instead.`);
    }
}

export default function RewardsSection() {
    const params = useSearchParams();
    const page = parsePage(params.get("page"));
    const { customer } = useCurrentCustomer();
    const query = useQuery({ queryKey: queryKeys.customer.rewards(page), queryFn: () => rewardsService.get(page), enabled: !!customer });

    if (query.isPending) return <PanelSkeleton rows={4} />;
    if (query.isError) {
        return (
            <AccountPanel title="Rewards">
                <p className="text-sm text-mist-700">We couldn&apos;t load your rewards. Refresh the page to try again.</p>
            </AccountPanel>
        );
    }
    const rewards = query.data;
    const working = rewards.enabled && rewards.status === "active";

    return (
        <AccountPanel
            title="Rewards"
            description="Share MANDE furniture and earn points when people buy. 1 point is ₦1 to spend on MANDE products."
            action={<Balance balance={rewards.balance} />}
        >
            <div className="flex flex-col gap-6">
                {rewards.status === "suspended" ? (
                    <Notice>Your rewards are on hold, so your link and coupons don&apos;t earn right now. Contact support if you think this is a mistake.</Notice>
                ) : !rewards.enabled ? (
                    <Notice>Rewards are paused at the moment, so links and coupons don&apos;t earn. Points you already have can still be spent.</Notice>
                ) : null}

                <ShareLink url={rewards.link.url} code={rewards.link.code} disabled={!working} />
                {rewards.coupons.length > 0 && <Coupons coupons={rewards.coupons} disabled={!working} />}
                <HowItWorks rules={rewards.rules} hasCoupons={rewards.coupons.length > 0} />
                <Statement rewards={rewards} page={page} />
            </div>
        </AccountPanel>
    );
}

function Notice({ children }: { children: React.ReactNode }) {
    return <p className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-mist-900">{children}</p>;
}

function Balance({ balance }: { balance: RewardsPage["balance"] }) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-primary-50 px-4 py-2">
            <Gift className="size-5 text-primary-700" aria-hidden />
            <div className="flex flex-col">
                <span className="text-xs text-mist-600">Points to spend</span>
                <span className={cn("text-lg font-bold", balance.availableKobo < 0 ? "text-error-600" : "text-mist-950")}>{points(balance.availableKobo)}</span>
                {balance.pendingKobo > 0 && <span className="text-xs text-mist-500">{points(balance.pendingKobo)} on the way</span>}
            </div>
        </div>
    );
}

function ShareButtons({ text, url }: { text: string; url: string }) {
    const message = `${text} ${url}`;
    const buttonClass = "inline-flex items-center gap-1.5 rounded-button border border-mist-200 px-3 py-2 text-sm font-medium text-mist-800 transition-colors hover:bg-mist-50";
    return (
        <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copy(url, "Link")} className={cn(buttonClass, "cursor-pointer")}>
                <Copy className="size-4" aria-hidden />
                Copy link
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                WhatsApp
            </a>
            <a href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                X
            </a>
        </div>
    );
}

function ShareLink({ url, code, disabled }: { url: string; code: string; disabled: boolean }) {
    return (
        <section className={cn("flex flex-col gap-3 rounded-xl border border-mist-200 p-4", disabled && "opacity-60")} aria-labelledby="rewards-link">
            <div className="flex flex-col gap-0.5">
                <h2 id="rewards-link" className="font-semibold text-mist-950">
                    Your referral link
                </h2>
                <p className="text-sm text-mist-500">Anyone who buys MANDE products after opening it earns you points.</p>
            </div>
            <p className="break-all rounded-lg bg-mist-50 px-3 py-2 font-mono text-sm text-mist-900" aria-label={`Referral link, code ${code}`}>
                {url}
            </p>
            <ShareButtons text="Furniture made in Nigeria, on MANDE Shop:" url={url} />
        </section>
    );
}

function couponDiscount(coupon: PersonalCoupon) {
    return coupon.type === "percentage" ? `${coupon.value}% off` : `${formatKobo(coupon.value)} off`;
}

function Coupons({ coupons, disabled }: { coupons: PersonalCoupon[]; disabled: boolean }) {
    return (
        <section className={cn("flex flex-col gap-3 rounded-xl border border-mist-200 p-4", disabled && "opacity-60")} aria-labelledby="rewards-coupons">
            <div className="flex flex-col gap-0.5">
                <h2 id="rewards-coupons" className="font-semibold text-mist-950">
                    Your coupons
                </h2>
                <p className="text-sm text-mist-500">People type these at checkout: they get a discount on MANDE products, and you earn points.</p>
            </div>
            <ul className="flex flex-col divide-y divide-mist-100">
                {coupons.map((coupon) => (
                    <li key={coupon.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                            <Ticket className="size-5 text-secondary-700" aria-hidden />
                            <div className="flex flex-col">
                                <span className="font-mono font-semibold text-mist-950">{coupon.code}</span>
                                <span className="text-xs text-mist-500">
                                    {couponDiscount(coupon)} for the buyer
                                    {coupon.usesLeft !== null && `, ${coupon.usesLeft} ${coupon.usesLeft === 1 ? "use" : "uses"} left`}
                                    {coupon.expiresAt && `, until ${DATE.format(new Date(coupon.expiresAt))}`}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => copy(coupon.code, "Code")}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-button border border-mist-200 px-3 py-2 text-sm font-medium text-mist-800 transition-colors hover:bg-mist-50"
                        >
                            <Copy className="size-4" aria-hidden />
                            Copy code
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function HowItWorks({ rules, hasCoupons }: { rules: RewardsPage["rules"]; hasCoupons: boolean }) {
    return (
        <section className="flex flex-col gap-2 rounded-xl bg-mist-50 p-4 text-sm text-mist-700" aria-labelledby="rewards-how">
            <h2 id="rewards-how" className="font-semibold text-mist-950">
                How it works
            </h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
                <li>
                    Each MANDE product earns you up to {rules.linkRewardPercent}% of its price{hasCoupons && rules.couponRewardPercent !== rules.linkRewardPercent ? ` (${rules.couponRewardPercent}% through a coupon)` : ""}, spread over a
                    number of sales shown on the product. You earn on every sale, not just the first.
                </li>
                <li>Your link counts for purchases made within {rules.attributionDays} days of opening it. Your own orders don&apos;t count.</li>
                <li>Points are on the way until the order is delivered and its return window has passed, then you can spend them on MANDE products.</li>
                <li>Points expire {rules.creditExpiryDays} days after you can spend them. We&apos;ll email you a week before.</li>
                <li>Points have no cash value and can&apos;t be withdrawn or transferred.</li>
            </ul>
        </section>
    );
}

const STATUS_LABEL: Record<RewardsEntry["status"], string | null> = { pending: "On the way", available: null, void: "Cancelled" };

function Statement({ rewards, page }: { rewards: RewardsPage; page: number }) {
    if (rewards.entries.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-mist-50 px-6 py-10 text-center">
                <Gift className="size-6 text-mist-400" aria-hidden />
                <p className="font-semibold text-mist-950">No points yet</p>
                <p className="max-w-sm text-sm text-mist-600">Share your link. When someone buys MANDE products through it, your points show here.</p>
            </div>
        );
    }
    return (
        <section className="flex flex-col gap-3" aria-labelledby="rewards-statement">
            <h2 id="rewards-statement" className="font-semibold text-mist-950">
                Your points
            </h2>
            <ul className="flex flex-col divide-y divide-mist-100">
                {rewards.entries.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div className="flex min-w-0 flex-col">
                            <span className="text-mist-950">{entry.summary}</span>
                            <span className="text-xs text-mist-500">
                                {DATE.format(new Date(entry.at))}
                                {entry.orderCode && entry.kind !== "earn" && entry.kind !== "reverse" && (
                                    <>
                                        {", "}
                                        <Link href={orderHref(entry.orderCode)} className="text-secondary-700 hover:underline">
                                            {entry.orderCode}
                                        </Link>
                                    </>
                                )}
                                {entry.status === "available" && entry.expiresAt && `, expires ${DATE.format(new Date(entry.expiresAt))}`}
                            </span>
                        </div>
                        <div className="flex shrink-0 flex-col items-end">
                            <span className={cn("font-semibold", entry.status === "void" ? "text-mist-400 line-through" : entry.amountKobo > 0 ? "text-primary-800" : "text-mist-950")}>
                                {entry.amountKobo > 0 ? "+" : ""}
                                {points(entry.amountKobo)}
                            </span>
                            {STATUS_LABEL[entry.status] && <span className="text-xs text-mist-500">{STATUS_LABEL[entry.status]}</span>}
                        </div>
                    </li>
                ))}
            </ul>
            <Pagination page={page} totalPages={rewards.totalPages} hrefFor={(target) => (target === 1 ? REWARDS_URL : `${REWARDS_URL}?page=${target}`)} />
        </section>
    );
}
