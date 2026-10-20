import Image from "next/image";
import { BadgeCheck, MessageSquareReply, Star } from "lucide-react";
import type { ProductReview } from "@/lib/types/shop";

const DATE = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });

export function Stars({ rating, size = "size-4" }: { rating: number; size?: string }) {
    return (
        <span className="flex items-center" aria-label={`${rating} out of 5 stars`} role="img">
            {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className={`${size} ${index < rating ? "fill-warning-400 text-warning-400" : "text-neutral-300"}`} aria-hidden />
            ))}
        </span>
    );
}

/** One review: the stars, who wrote it (a verified buyer), when, what they said, their photos, and the seller's reply. */
export default function ReviewCard({ review }: { review: ProductReview }) {
    return (
        <article className="flex flex-col gap-2 border-b border-border py-4 last:border-b-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars rating={review.rating} />
                <span className="text-sm font-medium text-neutral-900">{review.author}</span>
                {review.verifiedPurchase && (
                    <span className="flex items-center gap-1 text-xs font-medium text-primary-700">
                        <BadgeCheck className="size-3.5" aria-hidden />
                        Verified purchase
                    </span>
                )}
                <span className="text-xs text-muted-foreground">
                    {DATE.format(new Date(review.createdAt))}
                    {review.editedAt ? " (edited)" : ""}
                </span>
            </div>
            {review.body && <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{review.body}</p>}
            {review.images.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {review.images.map((image, index) => (
                        <li key={image.url} className="relative size-20 overflow-hidden rounded-lg bg-mist-100">
                            <Image src={image.url} alt={`Photo ${index + 1} from ${review.author}`} fill sizes="80px" className="object-cover" />
                        </li>
                    ))}
                </ul>
            )}
            {review.reply && (
                <div className="ml-4 flex gap-2 rounded-lg bg-mist-50 p-3 text-sm">
                    <MessageSquareReply className="mt-0.5 size-4 shrink-0 text-mist-500" aria-hidden />
                    <p className="text-neutral-700">
                        <span className="font-medium text-neutral-900">The seller replied: </span>
                        {review.reply.body}
                    </p>
                </div>
            )}
        </article>
    );
}
