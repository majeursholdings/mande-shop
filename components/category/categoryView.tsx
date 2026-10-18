import { Suspense } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { categoryHref, subcategoryHref, type ShopCategory, type ShopSubcategory } from "@/constant/shop";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import { ProductGridSkeleton } from "@/components/products/productGrid";
import ProductListing, { type ListingSearchParams } from "@/components/products/productListing";
import SortSelect from "@/components/products/sortSelect";
import { Skeleton } from "@/components/ui/skeleton";

const CHIP_CLASS =
    "inline-flex h-9 items-center rounded-full border px-4 text-sm outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * A category's page, or one of its subcategories': where it sits, its
 * subcategories as links (the one you're on picked out), the sort, and a page
 * of its products.
 */
export default function CategoryView({
    category,
    subcategory,
    searchParams,
}: {
    category: ShopCategory;
    subcategory?: ShopSubcategory;
    searchParams: ListingSearchParams;
}) {
    const basePath = subcategory ? subcategoryHref(category.slug, subcategory.slug) : categoryHref(category.slug);

    return (
        <div className="container mx-auto flex flex-col gap-6">
            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    subcategory ? { label: category.name, href: categoryHref(category.slug) } : { label: category.name },
                    ...(subcategory ? [{ label: subcategory.name }] : []),
                ]}
            />

            <h1 className="text-3xl tracking-tight text-neutral-900 md:text-4xl">{subcategory?.name ?? category.name}</h1>

            <nav aria-label={`${category.name} subcategories`}>
                <ul className="flex flex-wrap gap-2">
                    <li>
                        <Link
                            href={categoryHref(category.slug)}
                            aria-current={subcategory ? undefined : "page"}
                            className={cn(
                                CHIP_CLASS,
                                subcategory
                                    ? "border-border bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50"
                                    : "border-primary bg-primary text-primary-foreground",
                            )}
                        >
                            All {category.name.toLowerCase()}
                        </Link>
                    </li>
                    {category.subcategories.map((sub) => {
                        const active = sub.slug === subcategory?.slug;
                        return (
                            <li key={sub.slug}>
                                <Link
                                    href={subcategoryHref(category.slug, sub.slug)}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        CHIP_CLASS,
                                        active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50",
                                    )}
                                >
                                    {sub.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="flex justify-end border-t border-border pt-6">
                {/* It reads the URL's sort, which is only known per request */}
                <Suspense fallback={<div className="h-10 w-48 rounded-button border border-border bg-white" aria-hidden />}>
                    <SortSelect />
                </Suspense>
            </div>

            <Suspense fallback={<ProductGridSkeleton />}>
                <ProductListing
                    searchParams={searchParams}
                    basePath={basePath}
                    category={category.slug}
                    subcategory={subcategory?.slug}
                    emptyText={`${subcategory?.name ?? category.name} will show here as soon as sellers list them.`}
                />
            </Suspense>
        </div>
    );
}

/** The category page while its params resolve: shaped like the heading and chips. */
export function CategoryViewSkeleton() {
    return (
        <div className="container mx-auto flex flex-col gap-6" aria-hidden>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-64" />
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-9 w-28 rounded-full" />
                ))}
            </div>
            <ProductGridSkeleton count={8} />
        </div>
    );
}
