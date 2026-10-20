import type { Metadata } from "next";
import { Suspense } from "react";
import WishlistView, { WishlistSkeleton } from "@/components/wishlist/wishlistView";

export const metadata: Metadata = { title: "Your wishlist" };

export default function WishlistPage() {
    return (
        <main className="flex-1 bg-mist-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="container mx-auto flex flex-col gap-6">
                <h1 className="text-2xl font-bold text-mist-950">Your wishlist</h1>
                <Suspense fallback={<WishlistSkeleton />}>
                    <WishlistView />
                </Suspense>
            </div>
        </main>
    );
}
