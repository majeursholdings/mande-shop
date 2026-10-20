"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, MessageSquareText, Star, Store } from "lucide-react";
import { toast } from "sonner";
import { ReviewDialog, StarsInline } from "@/components/orders/orderActions";
import Pagination from "@/components/products/pagination";
import { Button } from "@/components/ui/button";
import { orderHref } from "@/constant/orders";
import { parsePage } from "@/constant/shop";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { checkoutService } from "@/lib/services/checkoutService";
import type { ToReviewItem, WrittenReview } from "@/lib/types/shop";
import { cn } from "@/lib/utils";
import { AccountPanel, PanelSkeleton } from "./accountShell";

// ─────────────────────────────────────────────────────────────────────────────
// "Your reviews" (SHOP_IMPLEMENTATION.md 10.2): two tabs, `?tab=` in the URL.
//  • To review: products and sellers from delivered orders still waiting for
//    a review, and until when
//  • Your reviews: what they wrote, a page at a time, with the seller's reply,
//    or why MANDE hid it; editing (within the window) and deleting
// ─────────────────────────────────────────────────────────────────────────────

const DATE = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });

export default function ReviewsSection() {
    const params = useSearchParams();
    const tab = params.get("tab") === "yours" ? "yours" : "to-review";
    const tabClass = (active: boolean) =>
        cn("rounded-button px-3 py-2 text-sm font-medium transition-colors", active ? "bg-secondary-700 text-white" : "text-mist-700 hover:bg-mist-100");
    return (
        <AccountPanel title="Reviews" description="Your reviews help other buyers choose, and good makers get noticed.">
            <nav aria-label="Reviews" className="mb-5 flex gap-2">
                <Link href="/account/reviews" aria-current={tab === "to-review" ? "page" : undefined} className={tabClass(tab === "to-review")}>
                    To review
                </Link>
                <Link href="/account/reviews?tab=yours" aria-current={tab === "yours" ? "page" : undefined} className={tabClass(tab === "yours")}>
                    Your reviews
                </Link>
            </nav>
            {tab === "to-review" ? <ToReview /> : <Yours page={parsePage(params.get("page"))} />}
        </AccountPanel>
    );
}

function useRefreshReviews() {
    const queryClient = useQueryClient();
    return () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.customer.reviewsAll() });
        void queryClient.invalidateQueries({ queryKey: ["customer", "orders"] });
    };
}

function ToReview() {
    const { customer } = useCurrentCustomer();
    const refresh = useRefreshReviews();
    const query = useQuery({ queryKey: queryKeys.customer.toReview(), queryFn: checkoutService.toReview, enabled: !!customer });
    const [writing, setWriting] = useState<ToReviewItem | null>(null);

    if (query.isPending) return <PanelSkeleton rows={2} />;
    if (query.isError) return <p className="text-sm text-mist-700">We couldn&apos;t load this. Refresh the page to try again.</p>;
    if (query.data.length === 0) {
        return (
            <Empty
                title="Nothing waiting for a review"
                text="When an order is delivered, its products and seller show here for you to review."
            />
        );
    }
    return (
        <>
            <ul className="flex flex-col divide-y divide-mist-100">
                {query.data.map((item) => (
                    <li key={`${item.partId}-${item.kind}-${item.line?.id ?? "seller"}`} className="flex items-center gap-3 py-3">
                        <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist-100 text-mist-400">
                            {item.kind === "seller" ? (
                                <Store className="size-5" aria-hidden />
                            ) : item.line?.image ? (
                                <Image src={item.line.image.url} alt="" fill sizes="56px" className="object-cover" />
                            ) : (
                                <ImageOff className="size-5" aria-hidden />
                            )}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium text-mist-950">{item.kind === "seller" ? item.seller.name : item.line?.title}</span>
                            <span className="text-xs text-mist-500">
                                {item.kind === "seller" ? "The seller" : `From ${item.seller.name}`}, order{" "}
                                <Link href={orderHref(item.orderCode)} className="hover:underline">
                                    {item.orderCode}
                                </Link>
                                . Review by {DATE.format(new Date(item.until))}.
                            </span>
                        </span>
                        <Button type="button" variant="outline" onClick={() => setWriting(item)} className="h-9 shrink-0 gap-1.5 rounded-button text-sm">
                            <Star className="size-4" aria-hidden />
                            Review
                        </Button>
                    </li>
                ))}
            </ul>
            {writing && (
                <ReviewDialog
                    title={writing.kind === "seller" ? `Review ${writing.seller.name}` : `Review ${writing.line?.title}`}
                    description={writing.kind === "seller" ? "How was buying from them: communication, packing and delivery?" : "Tell other buyers about the quality, the finish and whether it matched the photos."}
                    onClose={() => setWriting(null)}
                    onSubmit={async (rating, body) => {
                        await checkoutService.writeReview({
                            orderCode: writing.orderCode,
                            partId: writing.partId,
                            kind: writing.kind,
                            ...(writing.kind === "product" && writing.line && { lineId: writing.line.id }),
                            rating,
                            ...(body && { body }),
                        });
                        refresh();
                    }}
                />
            )}
        </>
    );
}

function Yours({ page }: { page: number }) {
    const { customer } = useCurrentCustomer();
    const query = useQuery({ queryKey: queryKeys.customer.reviews(page), queryFn: () => checkoutService.myReviews(page), enabled: !!customer, placeholderData: (previous) => previous });
    if (query.isPending) return <PanelSkeleton rows={2} />;
    if (query.isError) return <p className="text-sm text-mist-700">We couldn&apos;t load your reviews. Refresh the page to try again.</p>;
    if (query.data.total === 0) return <Empty title="You haven't written a review yet" text="Your reviews show here once you've written some." />;
    return (
        <div className="flex flex-col gap-4">
            <ul className="flex flex-col divide-y divide-mist-100">
                {query.data.reviews.map((review) => (
                    <WrittenReviewItem key={review.id} review={review} />
                ))}
            </ul>
            <Pagination page={query.data.page} totalPages={query.data.totalPages} hrefFor={(target) => `/account/reviews?tab=yours${target > 1 ? `&page=${target}` : ""}`} />
        </div>
    );
}

function WrittenReviewItem({ review }: { review: WrittenReview }) {
    const refresh = useRefreshReviews();
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const remove = async () => {
        setBusy(true);
        try {
            await checkoutService.deleteReview(review.id);
            toast.success("Review deleted.");
            refresh();
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't delete your review."));
        } finally {
            setBusy(false);
        }
    };
    const about =
        review.kind === "product" && review.product ? (
            <Link href={`/p/${review.product.slug}`} className="font-medium text-mist-950 hover:text-primary-700">
                {review.product.title}
            </Link>
        ) : (
            <span className="font-medium text-mist-950">{review.seller?.name ?? "The seller"}</span>
        );
    return (
        <li className="flex flex-col gap-2 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {about}
                <StarsInline rating={review.rating} />
                <span className="text-xs text-mist-500">
                    {DATE.format(new Date(review.createdAt))}
                    {review.editedAt ? " (edited)" : ""}
                </span>
            </div>
            {review.body && <p className="whitespace-pre-line text-sm text-mist-700">{review.body}</p>}
            {review.status === "hidden" && <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-800">Hidden by MANDE: {review.hiddenReason}</p>}
            {review.reply && (
                <p className="rounded-lg bg-mist-50 px-3 py-2 text-sm text-mist-700">
                    <span className="font-medium text-mist-950">The seller replied: </span>
                    {review.reply.body}
                </p>
            )}
            <div className="flex gap-4 text-sm">
                <button type="button" onClick={() => setEditing(true)} className="cursor-pointer text-secondary-700 hover:underline">
                    Edit
                </button>
                <button type="button" onClick={remove} disabled={busy} className="cursor-pointer text-mist-500 hover:text-error-700">
                    Delete
                </button>
            </div>
            {editing && (
                <ReviewDialog
                    title="Edit your review"
                    initial={{ id: review.id, rating: review.rating, body: review.body, hidden: review.status === "hidden" }}
                    onClose={() => setEditing(false)}
                    onSubmit={async (rating, body) => {
                        await checkoutService.editReview(review.id, { rating, body });
                        refresh();
                    }}
                />
            )}
        </li>
    );
}

function Empty({ title, text }: { title: string; text: string }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-mist-300 px-6 py-10 text-center">
            <MessageSquareText className="size-6 text-mist-400" aria-hidden />
            <p className="font-medium text-mist-950">{title}</p>
            <p className="text-sm text-mist-500">{text}</p>
        </div>
    );
}
