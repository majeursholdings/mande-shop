import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/products/productGrid";
import ProductListing, { type ListingSearchParams } from "@/components/products/productListing";

/**
 * Every listed product, Recommended first, a page at a time. The heading is
 * part of the static shell; the list reads `?page=`, so it streams in behind
 * a skeleton (SHOP_IMPLEMENTATION.md 10.3).
 */
export default function ProductsSection({ searchParams }: { searchParams: ListingSearchParams }) {
    return (
        <section aria-labelledby="products-heading" className="scroll-mt-20 px-2.5 py-12 sm:px-6 md:py-16 lg:px-8" id="products">
            <div className="container mx-auto">
                <h2 id="products-heading" className="text-2xl tracking-tight text-neutral-900 md:text-3xl">
                    Products
                </h2>
                <div className="mt-6">
                    <Suspense fallback={<ProductGridSkeleton />}>
                        <ProductListing searchParams={searchParams} basePath="/" anchor="#products" />
                    </Suspense>
                </div>
            </div>
        </section>
    );
}
