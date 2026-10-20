"use client";

import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { addToCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

/**
 * "Add to cart" on a product card: one at a time, up to what's in stock.
 * It sits above the card's link (which covers the card), so tapping it adds
 * rather than opens the product. Once it's in the cart it says so.
 */
export default function CardAddToCart({ product }: { product: { id: string; slug: string; title: string; stock: number | null } }) {
    const router = useRouter();
    const inCart = useCart().find((item) => item.productId === product.id);
    const soldOut = product.stock === 0;
    const atMax = !!inCart && product.stock !== null && inCart.quantity >= product.stock;

    const add = () => {
        if (!addToCart({ productId: product.id, slug: product.slug }, 1, product.stock)) {
            toast.error("Your cart is full. Check out or remove something first.");
            return;
        }
        toast.success(`${product.title} is in your cart.`, { action: { label: "View cart", onClick: () => router.push("/cart") } });
    };

    return (
        <button
            type="button"
            onClick={add}
            disabled={soldOut || atMax}
            aria-label={soldOut ? `${product.title} is sold out` : `Add ${product.title} to your cart`}
            className={cn(
                "relative z-10 mt-2 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-button text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed",
                inCart ? "border border-secondary-700 text-secondary-700 hover:bg-secondary-50" : "bg-secondary-700 text-white hover:bg-secondary-900",
                "disabled:border-transparent disabled:bg-mist-200 disabled:text-mist-500",
            )}
        >
            {inCart && !soldOut ? <Check className="size-4" aria-hidden /> : <ShoppingCart className="size-4" aria-hidden />}
            {soldOut ? "Sold out" : atMax ? "All in your cart" : inCart ? `In cart (${inCart.quantity}), add one` : "Add to cart"}
        </button>
    );
}
