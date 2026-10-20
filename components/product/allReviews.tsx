import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import Pagination from "@/components/products/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { parsePage, productHref } from "@/constant/shop";
import { getProduct, getProductReviews } from "@/lib/catalogue/products";
import type { ReviewSort } from "@/lib/types/shop";
import { cn } from "@/lib/utils";
import ReviewCard from "./reviewCard";
import { StarBreakdown } from "./reviewsSection";

const SORTS: { value: ReviewSort; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "highest", label: "Highest rated" },
    { value: "lowest", label: "Lowest rated" },
];
const CHIP = "inline-flex h-9 items-center rounded-full border px-4 text-sm outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/50";
const chip = (active: boolean) => cn(CHIP, active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50");

type Filters = { sort: ReviewSort; stars?: number; withPhotos?: boolean; page?: number };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** The address for these filters, defaults left out. */
function hrefFor(slug: string, filters: Filters) {
    const query = new URLSearchParams();
    if (filters.sort !== "newest") query.set("sort", filters.sort);
    if (filters.stars) query.set("stars", String(filters.stars));
    if (filters.withPhotos) query.set("photos", "1");
    if (filters.page && filters.page > 1) query.set("page", String(filters.page));
    const search = query.toString();
    return `/p/${slug}/reviews${search ? `?${search}` : ""}`;
}

/**
 * Every review of a product (SHOP_IMPLEMENTATION.md 10.2): the breakdown (each
 * bar filters to its stars), filters for stars and photos, the sort, and
 * numbered pages, all in the URL. Cached per product and filters.
 */
export default async function AllReviews({ slug, searchParams }: { slug: string; searchParams: Record<string, string | string[] | undefined> }) {
    const stars = Number(first(searchParams.stars));
    const filters: Filters = {
        sort: SORTS.some((option) => option.value === first(searchParams.sort)) ? (first(searchParams.sort) as ReviewSort) : "newest",
        stars: Number.isInteger(stars) && stars >= 1 && stars <= 5 ? stars : undefined,
        withPhotos: first(searchParams.photos) === "1",
    };
    const page = parsePage(searchParams.page);
    const [product, reviews] = await Promise.all([getProduct(slug), getProductReviews(slug, { ...filters, page, limit: 10 })]);
    if (!product || !reviews) return null;

    return (
        <div className="container mx-auto flex flex-col gap-6">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: product.title, href: productHref(product.slug) }, { label: "Reviews" }]} />
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl tracking-tight text-neutral-900 md:text-3xl">Reviews of {product.title}</h1>
                <p className="text-sm text-muted-foreground">Only buyers whose order was delivered can review.</p>
            </div>

            {reviews.reviewCount === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white px-6 py-12 text-center">
                    <MessageSquareText className="size-7 text-mist-400" aria-hidden />
                    <p className="font-medium text-neutral-900">No reviews yet</p>
                    <Link href={productHref(product.slug)} className="text-sm font-medium text-primary-700 hover:underline">
                        Back to the product
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
                    <aside className="rounded-2xl border border-border bg-white p-5 lg:sticky lg:top-24">
                        <StarBreakdown page={reviews} hrefFor={(value) => hrefFor(slug, { sort: filters.sort, stars: value })} />
                    </aside>
                    <div className="flex flex-col gap-4">
                        <nav aria-label="Filter reviews" className="flex flex-wrap gap-2">
                            <Link href={hrefFor(slug, { sort: filters.sort })} className={chip(!filters.stars && !filters.withPhotos)}>
                                All
                            </Link>
                            {[5, 4, 3, 2, 1].map((value) => (
                                <Link key={value} href={hrefFor(slug, { sort: filters.sort, stars: value })} className={chip(filters.stars === value)}>
                                    {value} star
                                </Link>
                            ))}
                            <Link href={hrefFor(slug, { sort: filters.sort, withPhotos: true })} className={chip(!!filters.withPhotos)}>
                                With photos
                            </Link>
                        </nav>
                        <nav aria-label="Sort reviews" className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Sort:</span>
                            {SORTS.map((option) => (
                                <Link
                                    key={option.value}
                                    href={hrefFor(slug, { ...filters, sort: option.value })}
                                    aria-current={option.value === filters.sort ? "page" : undefined}
                                    className={cn("rounded px-2 py-1", option.value === filters.sort ? "font-medium text-primary-800 underline underline-offset-4" : "text-neutral-700 hover:text-primary-700")}
                                >
                                    {option.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="rounded-2xl border border-border bg-white px-5">
                            {reviews.reviews.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">No reviews match. Try another filter.</p>
                            ) : (
                                reviews.reviews.map((review) => <ReviewCard key={review.id} review={review} />)
                            )}
                        </div>
                        <Pagination page={reviews.page} totalPages={reviews.totalPages} hrefFor={(target) => hrefFor(slug, { ...filters, page: target })} />
                    </div>
                </div>
            )}
        </div>
    );
}

export function AllReviewsSkeleton() {
    return (
        <div className="container mx-auto flex flex-col gap-6" aria-hidden>
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-9 w-80" />
            <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        </div>
    );
}
