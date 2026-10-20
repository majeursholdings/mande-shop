import type { Metadata } from "next";
import ContinueShopping from "@/components/cart/continueShopping";
import CartView from "@/components/cart/cartView";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
    return (
        <main className="flex-1 bg-mist-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="container mx-auto flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-mist-950">Your cart</h1>
                    <ContinueShopping />
                </div>
                <CartView />
            </div>
        </main>
    );
}
