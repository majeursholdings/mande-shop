import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutComplete, { CompleteSkeleton } from "@/components/checkout/checkoutComplete";

export const metadata: Metadata = { title: "Your order" };

export default function CheckoutCompletePage() {
    return (
        <main className="flex-1 bg-mist-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="container mx-auto">
                <Suspense fallback={<CompleteSkeleton />}>
                    <CheckoutComplete />
                </Suspense>
            </div>
        </main>
    );
}
