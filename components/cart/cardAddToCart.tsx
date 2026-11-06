"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { productHref } from "@/constant/shop";
import { addToCart } from "@/lib/cart";
import { CART_BUTTON_CLASS, CART_BUTTON_OUTLINE_CLASS, CART_BUTTON_SOLD_OUT_CLASS } from "@/components/customForm/formButtons";
import { cn } from "@/lib/utils";

/**
 * "Add to cart" on a product card: one at a time, up to what's in stock.
 * It sits above the card's link (which covers the card), so tapping it adds
 * rather than opens the product. Once it's in the cart it says so. A
 * product with variants is bought as one of them, chosen on its page, so
 * the card links there instead ("Choose options").
 */
export default function CardAddToCart({ product }: { product: { id: string; slug: string; title: string; stock: number | null; hasVariants?: boolean } }) {
    if (product.hasVariants) return <ChooseOptions product={product} />;
    return <AddOne product={product} />;
}

const BUTTON_CLASS =
    "relative z-10 mt-2 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-button text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed";

function ChooseOptions({ product }: { product: { slug: string; title: string; stock: number | null } }) {
    if (product.stock === 0) {
        return (
            <button type="button" disabled aria-label={`${product.title} is sold out`} className={cn(BUTTON_CLASS, CART_BUTTON_SOLD_OUT_CLASS)}>
                Sold out
            </button>
        );
    }
    return (
        <Link href={productHref(product.slug)} aria-label={`Choose options for ${product.title}`} className={cn(BUTTON_CLASS, CART_BUTTON_OUTLINE_CLASS)}>
            Choose options
        </Link>
    );
}

function AddOne({ product }: { product: { id: string; slug: string; title: string; stock: number | null } }) {
    const router = useRouter();
    // Only a line without a variant: this product has none
    const inCart = useCart().find((item) => item.productId === product.id && !item.variantId);
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
            className={cn(
                BUTTON_CLASS,
                inCart ? CART_BUTTON_OUTLINE_CLASS : CART_BUTTON_CLASS,
                CART_BUTTON_SOLD_OUT_CLASS,
            )}
        >
            {inCart && !soldOut ? <Check className="size-4" aria-hidden /> : <ShoppingCart className="size-4" aria-hidden />}
            {soldOut ? "Sold out" : atMax ? "All in your cart" : inCart ? `In cart (${inCart.quantity}), add one` : "Add to cart"}
            {/* The name starts with the words shown, so voice control can press it by them; the product says which card */}
            <span className="sr-only">: {product.title}</span>
        </button>
    );
}
