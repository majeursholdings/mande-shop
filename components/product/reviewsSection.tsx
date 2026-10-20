import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductReviews } from "@/lib/catalogue/products";
import type { ProductReviewPage } from "@/lib/types/shop";
import ReviewCard, { Stars } from "./reviewCard";

/** How many reviews the product page shows before "See all reviews". */
const SHOWN = 3;

/** The 5-to-1 star bars: how many reviews gave each, as a share of all. */
export function StarBreakdown({ page, hrefFor }: { page: Pick<ProductReviewPage, "breakdown" | "reviewCount" | "average">; hrefFor?: (stars: number) => string }) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <span className="text-4xl font-semibold text-neutral-900">{page.average.toFixed(1)}</span>
                <div className="flex flex-col gap-0.5">
                    <Stars rating={Math.round(page.average)} />
                    <span className="text-xs text-muted-foreground">
                        {page.reviewCount} {page.reviewCount === 1 ? "review" : "reviews"}
                    </span>
                </div>
            </div>
            <ul className="flex flex-col gap-1.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                    const count = page.breakdown[String(stars) as "1"] ?? 0;
                    const share = page.reviewCount ? Math.round((count / page.reviewCount) * 100) : 0;
                    const row = (
                        <>
                            <span className="w-10 shrink-0 text-xs text-neutral-700">{stars} star</span>
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-mist-100">
                                <span className="block h-full rounded-full bg-warning-400" style={{ width: `${share}%` }} />
                            </span>
                            <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{count}</span>
                        </>
                    );
                    return (
                        <li key={stars}>
                            {hrefFor && count > 0 ? (
                                <Link href={hrefFor(stars)} className="flex items-center gap-2 rounded hover:bg-mist-50" aria-label={`${count} ${stars}-star reviews`}>
                                    {row}
                                </Link>
                            ) : (
                                <span className="flex items-center gap-2" aria-label={`${count} ${stars}-star reviews`}>
                                    {row}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/**
 * The product page's reviews: the breakdown, the newest three, and "See all
 * reviews". Only buyers whose order was delivered can review, so the page
 * says so: it's why the reviews can be trusted.
 */
export default async function ReviewsSection({ slug }: { slug: string }) {
    let page: ProductReviewPage | null;
    try {
        page = await getProductReviews(slug, { page: 1, sort: "newest", limit: SHOWN });
    } catch {
        return null;
    }
    if (!page) return null;

    return (
        <section id="reviews" aria-labelledby="reviews-heading" className="flex scroll-mt-24 flex-col gap-4 rounded-2xl border border-border bg-white p-5 md:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="reviews-heading" className="text-xl text-neutral-900">
                    Customer reviews
                </h2>
                <p className="text-xs text-muted-foreground">Only buyers whose order was delivered can review.</p>
            </div>
            {page.reviewCount === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <MessageSquareText className="size-7 text-mist-400" aria-hidden />
                    <p className="font-medium text-neutral-900">No reviews yet</p>
                    <p className="max-w-sm text-sm text-muted-foreground">Bought this? Once it&apos;s delivered, you can review it from your orders.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-[16rem_1fr] md:gap-10">
                    <StarBreakdown page={page} />
                    <div className="flex flex-col">
                        {page.reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                        {page.reviewCount > SHOWN && (
                            <Link
                                href={`/p/${slug}/reviews`}
                                className="mt-3 inline-flex h-10 items-center justify-center self-start rounded-button border border-border px-4 text-sm font-medium text-neutral-800 transition-colors hover:bg-muted"
                            >
                                See all {page.reviewCount} reviews
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

export function ReviewsSectionSkeleton() {
    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6" aria-hidden>
            <Skeleton className="h-7 w-48" />
            <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
                <Skeleton className="h-36 w-full" />
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        </div>
    );
}
