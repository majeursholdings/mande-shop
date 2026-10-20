import { Suspense } from "react";
import { BadgeCheck, CalendarDays, MapPin, Package } from "lucide-react";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import RatingSummary from "@/components/product/ratingSummary";
import { ProductGridSkeleton } from "@/components/products/productGrid";
import ProductListing, { type ListingSearchParams } from "@/components/products/productListing";
import SortSelect from "@/components/products/sortSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { sellerHref } from "@/constant/shop";
import type { Store } from "@/lib/types/shop";
import StoreAvatar from "./storeAvatar";

const JOINED = new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric", timeZone: "Africa/Lagos" });

/**
 * A store's page (SHOP_IMPLEMENTATION.md 10.2): who the seller is (name,
 * photo, state, rating, specialities, how long they've sold on MANDE), then
 * their products with the usual sort and pages.
 */
export default function StoreView({ store, searchParams }: { store: Store; searchParams: ListingSearchParams }) {
    return (
        <div className="container mx-auto flex flex-col gap-6">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Sellers", href: "/sellers" }, { label: store.name }]} />

            <section aria-label="About the seller" className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
                <StoreAvatar store={store} size="lg" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <h1 className="flex flex-wrap items-center gap-2 text-2xl tracking-tight text-neutral-900 md:text-3xl">
                        {store.name}
                        {store.kind === "mande" ? (
                            <span className="rounded-full bg-primary-950 px-2 py-0.5 text-xs font-medium text-white">MANDE&apos;s own stock</span>
                        ) : (
                            <span className="flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800">
                                <BadgeCheck className="size-3.5" aria-hidden />
                                Verified maker
                            </span>
                        )}
                    </h1>
                    <RatingSummary rating={store.rating} />
                    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        {store.state && (
                            <li className="flex items-center gap-1">
                                <MapPin className="size-4" aria-hidden />
                                {store.state}
                            </li>
                        )}
                        <li className="flex items-center gap-1">
                            <Package className="size-4" aria-hidden />
                            {store.productCount} {store.productCount === 1 ? "product" : "products"}
                        </li>
                        <li className="flex items-center gap-1">
                            <CalendarDays className="size-4" aria-hidden />
                            Selling on MANDE since {JOINED.format(new Date(store.joinedAt))}
                        </li>
                    </ul>
                    {store.specialities.length > 0 && (
                        <ul className="flex flex-wrap gap-2" aria-label="Specialities">
                            {store.specialities.map((speciality) => (
                                <li key={speciality} className="rounded-full bg-mist-100 px-3 py-1 text-xs text-neutral-700">
                                    {speciality}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <div id="products" className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl text-neutral-900">Products</h2>
                <Suspense fallback={<Skeleton className="h-10 w-48" />}>
                    <SortSelect />
                </Suspense>
            </div>
            <Suspense fallback={<ProductGridSkeleton count={8} />}>
                <ProductListing searchParams={searchParams} basePath={sellerHref(store.slug)} seller={store.slug} anchor="#products" emptyText="This seller's products will show here." />
            </Suspense>
        </div>
    );
}

/** The store page while it loads: the seller's box, then product cards. */
export function StoreViewSkeleton() {
    return (
        <div className="container mx-auto flex flex-col gap-6" aria-hidden>
            <Skeleton className="h-5 w-48" />
            <div className="flex items-center gap-6 rounded-2xl border border-border bg-white p-6">
                <Skeleton className="size-20 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>
            <ProductGridSkeleton count={8} />
        </div>
    );
}
