import { PackageOpen } from "lucide-react";
import { getProductsPage } from "@/lib/catalogue/products";
import { parsePage, parseProductSort } from "@/constant/shop";
import type { ProductPage } from "@/lib/types/shop";
import ProductGrid from "./productGrid";
import Pagination from "./pagination";

export type ListingSearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * A page of listed products for the URL's `?page=` and `?sort=`, with numbered
 * page links that keep the sort. It reads searchParams, so render it inside
 * <Suspense> with ProductGridSkeleton (SHOP_IMPLEMENTATION.md 10.3).
 */
export default async function ProductListing({
    searchParams,
    basePath,
    category,
    subcategory,
    seller,
    anchor = "",
    emptyText = "Products will show here as soon as they're listed.",
}: {
    searchParams: ListingSearchParams;
    /** The page the list is on, e.g. "/c/bedroom", for its page links */
    basePath: string;
    category?: string;
    subcategory?: string;
    /** A store's slug, for its page */
    seller?: string;
    /** e.g. "#products", to bring the list back into view on a new page */
    anchor?: string;
    emptyText?: string;
}) {
    const params = await searchParams;
    const page = parsePage(params.page);
    const sort = parseProductSort(Array.isArray(params.sort) ? params.sort[0] : params.sort);

    let result: ProductPage;
    try {
        result = await getProductsPage({ page, sort, category, subcategory, seller });
    } catch {
        return (
            <p role="alert" className="rounded-xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">
                We couldn&apos;t load the products. Please refresh the page.
            </p>
        );
    }

    if (result.products.length === 0) {
        const pastTheEnd = result.total > 0;
        return (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
                <PackageOpen className="size-8 text-mist-500" aria-hidden />
                <p className="text-base font-medium text-neutral-900">{pastTheEnd ? "There's nothing on this page" : "No products yet"}</p>
                <p className="max-w-sm text-sm text-muted-foreground">{pastTheEnd ? "Go back to the first page to see the products." : emptyText}</p>
            </div>
        );
    }

    const hrefFor = (target: number) => {
        const query = new URLSearchParams();
        if (sort !== "recommended") query.set("sort", sort);
        if (target > 1) query.set("page", String(target));
        const search = query.toString();
        return `${basePath}${search ? `?${search}` : ""}${anchor}`;
    };

    return (
        <div className="flex flex-col gap-8">
            <p className="text-sm text-muted-foreground">
                {result.total} {result.total === 1 ? "product" : "products"}
                {result.totalPages > 1 && `, page ${result.page} of ${result.totalPages}`}
            </p>
            <ProductGrid products={result.products} />
            <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
        </div>
    );
}
