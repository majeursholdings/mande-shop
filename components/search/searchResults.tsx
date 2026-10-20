import { Suspense } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { ProductGridSkeleton } from "@/components/products/productGrid";
import ProductGrid from "@/components/products/productGrid";
import Pagination from "@/components/products/pagination";
import SortSelect from "@/components/products/sortSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { SHOP_CATEGORIES, categoryHref, getShopCategory, parsePage, parseProductSort } from "@/constant/shop";
import { searchProducts } from "@/lib/catalogue/products";
import type { ProductPage } from "@/lib/types/shop";
import { cn } from "@/lib/utils";
import SearchBox from "./searchBox";
import { searchHref } from "./searchLinks";
import SearchSuggestions, { SearchSuggestionsSkeleton } from "./searchSuggestions";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const CHIP_CLASS = "inline-flex h-9 items-center rounded-full border px-4 text-sm outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/50";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** The words searched for: trimmed, and empty when there's nothing (or one letter) to search. */
export const searchWords = (value: string | string[] | undefined) => {
    const q = first(value).trim().slice(0, 100);
    return q.length >= 2 ? q : "";
};

/**
 * The search page's results, for the URL's `?q=`, `?category=`, `?sort=` and
 * `?page=`: the box (prefilled), categories to narrow it down, the sort, the
 * products with numbered pages, and what to try when nothing matches.
 * Renders per request, inside <Suspense>.
 */
export default async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const q = searchWords(params.q);
    const category = getShopCategory(first(params.category))?.slug;
    const sort = parseProductSort(first(params.sort));
    const page = parsePage(params.page);

    if (!q) {
        return (
            <div className="flex flex-col gap-8">
                <SearchBox q="" />
                <section className="flex flex-col gap-3">
                    <h2 className="text-lg text-neutral-900">Or browse a category</h2>
                    <CategoryLinks align="start" />
                </section>
                <Suspense fallback={<SearchSuggestionsSkeleton />}>
                    <SearchSuggestions q="" />
                </Suspense>
            </div>
        );
    }

    let result: ProductPage;
    try {
        result = await searchProducts({ q, page, sort, category });
    } catch {
        return (
            <div className="flex flex-col gap-6">
                <SearchBox q={q} category={category} />
                <p role="alert" className="rounded-xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">
                    We couldn&apos;t search just now. Please try again.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <SearchBox q={q} category={category} />

            <nav aria-label="Narrow by category">
                <ul className="flex flex-wrap gap-2">
                    <li>
                        <Link href={searchHref(q, { sort })} aria-current={category ? undefined : "page"} className={chip(!category)}>
                            All categories
                        </Link>
                    </li>
                    {SHOP_CATEGORIES.map((option) => (
                        <li key={option.slug}>
                            <Link href={searchHref(q, { sort, category: option.slug })} aria-current={option.slug === category ? "page" : undefined} className={chip(option.slug === category)}>
                                {option.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                    {result.total === 0 ? (
                        <>No results for &ldquo;{q}&rdquo;</>
                    ) : (
                        <>
                            {result.total} {result.total === 1 ? "result" : "results"} for &ldquo;<span className="font-medium text-neutral-900">{q}</span>&rdquo;
                            {category ? ` in ${getShopCategory(category)?.name}` : ""}
                            {result.totalPages > 1 && `, page ${result.page} of ${result.totalPages}`}
                        </>
                    )}
                </p>
                {result.total > 0 && (
                    <Suspense fallback={<div className="h-10 w-48 rounded-button border border-border bg-white" aria-hidden />}>
                        <SortSelect />
                    </Suspense>
                )}
            </div>

            {result.products.length === 0 ? (
                result.total > 0 ? (
                    <NoResults q={q} pastTheEnd category={category} />
                ) : (
                    <NoResultsWithSuggestions q={q} category={category} />
                )
            ) : (
                <div className="flex flex-col gap-8">
                    <ProductGrid products={result.products} />
                    <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(target) => searchHref(q, { sort, category, page: target })} />
                </div>
            )}
        </div>
    );
}

const chip = (active: boolean) =>
    cn(CHIP_CLASS, active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50");

function NoResults({ q, pastTheEnd, category }: { q: string; pastTheEnd: boolean; category?: string }) {
    if (pastTheEnd) {
        return (
            <p className="rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
                There&apos;s nothing on this page.{" "}
                <Link href={searchHref(q, { category })} className="font-medium text-primary-700 hover:underline">
                    Go back to the first page
                </Link>
                .
            </p>
        );
    }
    return (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
            <SearchX className="size-8 text-mist-500" aria-hidden />
            <div className="flex flex-col gap-1">
                <p className="text-base font-medium text-neutral-900">Nothing matches &ldquo;{q}&rdquo;{category ? ` in ${getShopCategory(category)?.name}` : ""}</p>
                <p className="max-w-md text-sm text-muted-foreground">
                    {category ? (
                        <>
                            Try{" "}
                            <Link href={searchHref(q)} className="font-medium text-primary-700 hover:underline">
                                every category
                            </Link>
                            , check the spelling, or search for something more general, like &ldquo;bed&rdquo; or &ldquo;chair&rdquo;.
                        </>
                    ) : (
                        "Check the spelling, or search for something more general, like “bed” or “chair”. Or browse a category:"
                    )}
                </p>
            </div>
            {!category && <CategoryLinks />}
        </div>
    );
}

/** Nothing found: the message, then what's on offer instead (SearchSuggestions). */
function NoResultsWithSuggestions({ q, category }: { q: string; category?: string }) {
    return (
        <div className="flex flex-col gap-10">
            <NoResults q={q} pastTheEnd={false} category={category} />
            <Suspense fallback={<SearchSuggestionsSkeleton />}>
                <SearchSuggestions q={q} category={category} />
            </Suspense>
        </div>
    );
}

function CategoryLinks({ align = "center" }: { align?: "center" | "start" }) {
    return (
        <ul className={cn("flex flex-wrap gap-2", align === "center" && "justify-center")}>
            {SHOP_CATEGORIES.map((option) => (
                <li key={option.slug}>
                    <Link href={categoryHref(option.slug)} className={chip(false)}>
                        {option.name}
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export function SearchResultsSkeleton() {
    return (
        <div className="flex flex-col gap-6" aria-hidden>
            <Skeleton className="h-12 w-full" />
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }, (_, index) => (
                    <Skeleton key={index} className="h-9 w-28 rounded-full" />
                ))}
            </div>
            <Skeleton className="h-5 w-56" />
            <ProductGridSkeleton count={8} />
        </div>
    );
}
