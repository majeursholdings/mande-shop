"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import ProductCard from "@/components/products/productCard";
import Pagination from "@/components/products/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import { LOGIN_URL, withNext } from "@/constant/auth";
import { parsePage } from "@/constant/shop";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { queryKeys } from "@/lib/queryKeys";
import { shopService } from "@/lib/services/shopService";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// The wishlist page (SHOP_IMPLEMENTATION.md 5.5): saved products, a page at a
// time (`?page=`), newest saved first, each card with its own "Add to cart".
// A product that can't be bought any more stays, marked "Not available", so the
// customer can see what happened and remove it with its heart. Signed out,
// it asks them to sign in.
// ─────────────────────────────────────────────────────────────────────────────

export default function WishlistView() {
    const page = parsePage(useSearchParams().get("page"));
    const { customer, isPending: customerPending } = useCurrentCustomer();
    const query = useQuery({
        queryKey: queryKeys.customer.wishlist(page),
        queryFn: () => shopService.wishlist(page),
        enabled: !!customer,
        placeholderData: (previous) => previous,
    });

    if (!customerPending && !customer) {
        return (
            <EmptyState title="Save what you love" text="Sign in to save products and find them again on any device.">
                <Link href={withNext(LOGIN_URL, "/wishlist")} className={cn(PRIMARY_BUTTON_CLASS, "mt-2 inline-flex items-center")}>
                    Sign in
                </Link>
            </EmptyState>
        );
    }
    if (customerPending || query.isPending) return <WishlistSkeleton />;
    if (query.isError || !query.data) {
        return (
            <p role="alert" className="rounded-2xl border border-mist-200 bg-white p-6 text-sm text-mist-700">
                We couldn&apos;t load your wishlist. Check your connection and refresh the page.
            </p>
        );
    }
    if (query.data.total === 0) {
        return (
            <EmptyState title="Your wishlist is empty" text="Tap the heart on any product to save it here.">
                <Link href="/" className={cn(PRIMARY_BUTTON_CLASS, "mt-2 inline-flex items-center")}>
                    Start shopping
                </Link>
            </EmptyState>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <p className="text-sm text-mist-500">
                {query.data.total} saved {query.data.total === 1 ? "product" : "products"}
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {query.data.items.map((entry) => (
                    <li key={entry.product.id} className="flex flex-col gap-2">
                        <div className={cn(!entry.available && "opacity-60")}>
                            <ProductCard product={entry.product} />
                        </div>
                        {!entry.available && (
                            <p className="rounded-button bg-mist-100 px-3 py-2 text-center text-sm font-medium text-mist-700">
                                {entry.unavailableReason === "sold_out" ? "Sold out" : "Not available"}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
            <Pagination page={query.data.page} totalPages={query.data.totalPages} hrefFor={(target) => (target === 1 ? "/wishlist" : `/wishlist?page=${target}`)} />
        </div>
    );
}

function EmptyState({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-mist-200 bg-white px-6 py-16 text-center">
            <Heart className="size-8 text-mist-400" aria-hidden />
            <p className="text-lg font-semibold text-mist-950">{title}</p>
            <p className="text-sm text-mist-500">{text}</p>
            {children}
        </div>
    );
}

export function WishlistSkeleton() {
    return (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }, (_, index) => (
                <li key={index} className="flex flex-col gap-2">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                </li>
            ))}
        </ul>
    );
}
