"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PackageCheck, RotateCcw, Star, XCircle } from "lucide-react";
import { toast } from "sonner";
import { FormCancelButton, PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { checkoutService } from "@/lib/services/checkoutService";
import type { CustomerOrder, MyReview, OrderLine, OrderPart } from "@/lib/types/shop";
import { cn } from "@/lib/utils";
import ReturnDialog from "./returnDialog";

// ─────────────────────────────────────────────────────────────────────────────
// What a customer can do with a seller's part of their order: cancel it
// before the seller starts on it (refunded in full), confirm it arrived once
// it's shipped, and, once it's delivered, review each product and the seller
// (until the review window closes) and ask to return some of it (until the
// return window closes). The API decides what's allowed; these only show
// what it says is.
// ─────────────────────────────────────────────────────────────────────────────

const DATE = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", timeZone: "Africa/Lagos" });

function useRefresh(order: CustomerOrder) {
    const queryClient = useQueryClient();
    return (updated?: CustomerOrder) => {
        if (updated) queryClient.setQueryData(queryKeys.customer.order(order.code), updated);
        void queryClient.invalidateQueries({ queryKey: queryKeys.customer.order(order.code) });
        void queryClient.invalidateQueries({ queryKey: ["customer", "orders"] });
    };
}

/** Under a part: cancel, "It arrived", and the seller review. */
export function PartActions({ order, part }: { order: CustomerOrder; part: OrderPart }) {
    const refresh = useRefresh(order);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [busy, setBusy] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [returning, setReturning] = useState(false);

    const act = async (work: () => Promise<CustomerOrder>, done: string, failed: string) => {
        setBusy(true);
        try {
            refresh(await work());
            toast.success(done);
            setConfirmCancel(false);
        } catch (error) {
            toast.error(getErrorMessage(error, failed));
            refresh();
        } finally {
            setBusy(false);
        }
    };

    const showReview = part.review.open || part.review.seller;
    if (!part.canCancel && !part.canConfirmDelivery && !showReview && !part.returns.open) return null;

    return (
        <div className="mt-3 flex flex-col gap-3 border-t border-mist-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
                {part.canConfirmDelivery && (
                    <Button
                        type="button"
                        disabled={busy}
                        onClick={() => act(() => checkoutService.confirmDelivery(order.code, part.id), "Thanks! Glad it arrived.", "We couldn't confirm it just now.")}
                        className={cn(PRIMARY_BUTTON_CLASS, "h-9 gap-2 text-sm")}
                    >
                        <PackageCheck className="size-4" aria-hidden />
                        It arrived
                    </Button>
                )}
                {part.canCancel && !confirmCancel && (
                    <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmCancel(true)} className="h-9 gap-2 rounded-button text-sm text-error-700">
                        <XCircle className="size-4" aria-hidden />
                        Cancel this part
                    </Button>
                )}
                {part.review.open && !part.review.seller && (
                    <Button type="button" variant="outline" onClick={() => setReviewing(true)} className="h-9 gap-2 rounded-button text-sm">
                        <Star className="size-4" aria-hidden />
                        Review {part.seller.name}
                    </Button>
                )}
                {part.returns.open && (
                    <Button type="button" variant="outline" onClick={() => setReturning(true)} className="h-9 gap-2 rounded-button text-sm">
                        <RotateCcw className="size-4" aria-hidden />
                        Return items
                    </Button>
                )}
            </div>
            {confirmCancel && (
                <div className="flex flex-col gap-2 rounded-lg bg-error-50 p-3 text-sm">
                    <p className="text-error-800">
                        Cancel what you ordered from <span className="font-semibold">{part.seller.name}</span>? You&apos;ll be refunded in full, the way you paid.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={() => act(() => checkoutService.cancelPart(order.code, part.id), "Cancelled. Your refund is on its way.", "We couldn't cancel it. The seller may have started on it.")}
                            className="h-9 rounded-button bg-error-600 text-sm text-white hover:bg-error-700"
                        >
                            {busy ? "Cancelling..." : "Yes, cancel it"}
                        </Button>
                        <FormCancelButton onClick={() => setConfirmCancel(false)} disabled={busy}>
                            Keep it
                        </FormCancelButton>
                    </div>
                </div>
            )}
            {part.review.seller && <MyReviewLine label={`Your review of ${part.seller.name}`} review={part.review.seller} editable={part.review.open} onChanged={() => refresh()} />}
            {part.review.open && part.review.until && <p className="text-xs text-mist-500">You can review this order until {DATE.format(new Date(part.review.until))}.</p>}
            {part.returns.open && part.returns.until && <p className="text-xs text-mist-500">You can ask to return items until {DATE.format(new Date(part.returns.until))}.</p>}
            {returning && <ReturnDialog order={order} part={part} onClose={() => setReturning(false)} />}
            {reviewing && (
                <ReviewDialog
                    title={`Review ${part.seller.name}`}
                    description="How was buying from them: communication, packing and delivery?"
                    onClose={() => setReviewing(false)}
                    onSubmit={async (rating, body) => {
                        await checkoutService.writeReview({ orderCode: order.code, partId: part.id, kind: "seller", rating, ...(body && { body }) });
                        refresh();
                    }}
                />
            )}
        </div>
    );
}

/** Beside a delivered product: "Review this product", or their review of it. */
export function LineReview({ order, part, line }: { order: CustomerOrder; part: OrderPart; line: OrderLine }) {
    const refresh = useRefresh(order);
    const [reviewing, setReviewing] = useState(false);
    if (line.status === "cancelled") return null;
    if (line.review) return <MyReviewLine label="Your review" review={line.review} editable={part.review.open} onChanged={() => refresh()} compact />;
    if (!part.review.open) return null;
    return (
        <>
            <button type="button" onClick={() => setReviewing(true)} className="flex cursor-pointer items-center gap-1 self-start text-sm font-medium text-secondary-700 hover:underline">
                <Star className="size-3.5" aria-hidden />
                Review this product
            </button>
            {reviewing && (
                <ReviewDialog
                    title={`Review ${line.title}`}
                    description="Tell other buyers about the quality, the finish and whether it matched the photos."
                    onClose={() => setReviewing(false)}
                    onSubmit={async (rating, body) => {
                        await checkoutService.writeReview({ orderCode: order.code, partId: part.id, kind: "product", lineId: line.id, rating, ...(body && { body }) });
                        refresh();
                    }}
                />
            )}
        </>
    );
}

function MyReviewLine({ label, review, editable, onChanged, compact }: { label: string; review: MyReview; editable: boolean; onChanged: () => void; compact?: boolean }) {
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const remove = async () => {
        setBusy(true);
        try {
            await checkoutService.deleteReview(review.id);
            toast.success("Review deleted.");
            onChanged();
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't delete your review."));
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-sm", !compact && "rounded-lg bg-mist-50 p-3")}>
            <span className="text-mist-500">{label}:</span>
            <StarsInline rating={review.rating} />
            {review.hidden && <span className="text-xs font-medium text-error-700">Hidden by MANDE</span>}
            {editable && (
                <button type="button" onClick={() => setEditing(true)} className="cursor-pointer text-secondary-700 hover:underline">
                    Edit
                </button>
            )}
            <button type="button" onClick={remove} disabled={busy} className="cursor-pointer text-mist-500 hover:text-error-700">
                Delete
            </button>
            {editing && (
                <ReviewDialog
                    title="Edit your review"
                    initial={review}
                    onClose={() => setEditing(false)}
                    onSubmit={async (rating, body) => {
                        await checkoutService.editReview(review.id, { rating, body });
                        onChanged();
                    }}
                />
            )}
        </div>
    );
}

export function StarsInline({ rating }: { rating: number }) {
    return (
        <span className="flex" role="img" aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className={cn("size-3.5", index < rating ? "fill-warning-400 text-warning-400" : "text-neutral-300")} aria-hidden />
            ))}
        </span>
    );
}

const STAR_WORDS = ["Terrible", "Poor", "Okay", "Good", "Excellent"];

/** Stars (required) and a few words (optional), to write or edit a review. */
export function ReviewDialog({
    title,
    description,
    initial,
    onClose,
    onSubmit,
}: {
    title: string;
    description?: string;
    initial?: MyReview;
    onClose: () => void;
    onSubmit: (rating: number, body: string) => Promise<void>;
}) {
    const [rating, setRating] = useState(initial?.rating ?? 0);
    const [body, setBody] = useState(initial?.body ?? "");
    const [busy, setBusy] = useState(false);
    const submit = async () => {
        if (!rating) return;
        setBusy(true);
        try {
            await onSubmit(rating, body.trim());
            toast.success(initial ? "Review updated." : "Thanks for your review!");
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't save your review. Please try again."));
        } finally {
            setBusy(false);
        }
    };
    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <div className="flex flex-col gap-1">
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </div>
                <div className="flex flex-col gap-1">
                    <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={rating === value}
                                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                                onClick={() => setRating(value)}
                                className="cursor-pointer rounded p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                <Star className={cn("size-8", value <= rating ? "fill-warning-400 text-warning-400" : "text-neutral-300")} aria-hidden />
                            </button>
                        ))}
                    </div>
                    <span className="h-5 text-sm text-mist-500">{rating ? STAR_WORDS[rating - 1] : "Choose your stars"}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="review-body" className="text-sm font-medium text-mist-950">
                        Your review <span className="font-normal text-mist-500">(optional)</span>
                    </label>
                    <textarea
                        id="review-body"
                        value={body}
                        onChange={(event) => setBody(event.target.value.slice(0, 2000))}
                        rows={4}
                        maxLength={2000}
                        className="w-full resize-y rounded-button border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <p className="text-xs text-mist-500">Shown with your first name and last initial. Please don&apos;t include personal details.</p>
                </div>
                <div className="flex justify-end gap-3">
                    <FormCancelButton onClick={onClose} disabled={busy} />
                    <Button type="button" onClick={submit} disabled={!rating || busy} className={cn(PRIMARY_BUTTON_CLASS, "disabled:bg-mist-200 disabled:opacity-100")}>
                        {busy ? "Saving..." : initial ? "Save" : "Post review"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
