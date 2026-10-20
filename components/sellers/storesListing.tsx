import Link from "next/link";
import { Store as StoreIcon } from "lucide-react";
import { getStoresPage } from "@/lib/catalogue/sellers";
import { parsePage } from "@/constant/shop";
import Pagination from "@/components/products/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { StorePage, StoreSort } from "@/lib/types/shop";
import { cn } from "@/lib/utils";
import StoreCard from "./storeCard";

export const STORE_SORTS: { value: StoreSort; label: string }[] = [
    { value: "recommended", label: "Best rated" },
    { value: "products", label: "Most products" },
    { value: "newest", label: "Newest" },
];

export const parseStoreSort = (value: unknown): StoreSort => (STORE_SORTS.some((sort) => sort.value === value) ? (value as StoreSort) : "recommended");

const GRID_CLASS = "grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3";
const CHIP_CLASS = "inline-flex h-9 items-center rounded-full border px-4 text-sm outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/50";

const hrefFor = (sort: StoreSort, page = 1) => {
    const query = new URLSearchParams();
    if (sort !== "recommended") query.set("sort", sort);
    if (page > 1) query.set("page", String(page));
    const search = query.toString();
    return `/sellers${search ? `?${search}` : ""}`;
};

/**
 * A page of stores for the URL's `?page=` and `?sort=`: the sort as links (so
 * every version can be shared and crawled), the store cards and numbered
 * pages. It reads searchParams, so render it inside <Suspense> with
 * StoresListingSkeleton (SHOP_IMPLEMENTATION.md 10.3).
 */
export default async function StoresListing({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams;
    const page = parsePage(params.page);
    const sort = parseStoreSort(Array.isArray(params.sort) ? params.sort[0] : params.sort);

    let result: StorePage;
    try {
        result = await getStoresPage({ page, sort });
    } catch {
        return (
            <p role="alert" className="rounded-xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">
                We couldn&apos;t load the sellers. Please refresh the page.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <nav aria-label="Sort sellers">
                <ul className="flex flex-wrap gap-2">
                    {STORE_SORTS.map((option) => (
                        <li key={option.value}>
                            <Link
                                href={hrefFor(option.value)}
                                aria-current={option.value === sort ? "page" : undefined}
                                className={cn(
                                    CHIP_CLASS,
                                    option.value === sort ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50",
                                )}
                            >
                                {option.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            {result.sellers.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
                    <StoreIcon className="size-8 text-mist-500" aria-hidden />
                    <p className="text-base font-medium text-neutral-900">{result.total > 0 ? "There's nothing on this page" : "No sellers yet"}</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        {result.total > 0 ? "Go back to the first page to see the sellers." : "Sellers will show here as soon as they list their products."}
                    </p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground">
                        {result.total} {result.total === 1 ? "seller" : "sellers"}
                        {result.totalPages > 1 && `, page ${result.page} of ${result.totalPages}`}
                    </p>
                    <ul className={GRID_CLASS}>
                        {result.sellers.map((store) => (
                            <li key={store.slug}>
                                <StoreCard store={store} />
                            </li>
                        ))}
                    </ul>
                    <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(target) => hrefFor(sort, target)} />
                </>
            )}
        </div>
    );
}

export function StoresListingSkeleton() {
    return (
        <div className="flex flex-col gap-6" aria-hidden>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-32 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
            </div>
            <ul className={GRID_CLASS}>
                {Array.from({ length: 6 }, (_, index) => (
                    <li key={index} className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-14 rounded-full" />
                            <div className="flex flex-1 flex-col gap-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                    </li>
                ))}
            </ul>
        </div>
    );
}
