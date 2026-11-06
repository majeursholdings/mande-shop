"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Lock, Minus, Plus, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CART_BUTTON_CLASS, CART_BUTTON_SOLD_OUT_CLASS, PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import WishlistHeart from "@/components/wishlist/wishlistHeart";
import { useDeliveryState } from "@/hooks/useCart";
import { CART_MAX_QUANTITY, addToCart } from "@/lib/cart";
import { PAYMENT_METHODS } from "@/constant/trust";
import { formatKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { shopService } from "@/lib/services/shopService";
import { cn } from "@/lib/utils";
import StateSelect from "./stateSelect";

// ─────────────────────────────────────────────────────────────────────────────
// Buying from the product page: how many, "Add to cart", the wishlist heart,
// and what delivery costs to the visitor's chosen state. The page itself is
// cached and the same for everyone; this part is the visitor's own, priced
// now by the API (the stock and fee shown on a cached page may be a minute
// old). A product with variants is bought as one of them: `variant` is the
// one chosen, and until then `chooseHint` says what's left to choose and
// "Add to cart" stays closed.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    /** `stock` is the chosen variant's, when there is one. */
    product: { id: string; slug: string; title: string; stock: number | null };
    variant?: { id: string; label: string } | null;
    /** Set while options are still to be chosen: "Choose color and size to add it to your cart." */
    chooseHint?: string | null;
};

export default function ProductPurchase({ product, variant = null, chooseHint = null }: Props) {
    const router = useRouter();
    const state = useDeliveryState();
    const [quantity, setQuantity] = useState(1);
    const max = Math.min(product.stock ?? CART_MAX_QUANTITY, CART_MAX_QUANTITY);
    const soldOut = product.stock === 0;
    const closed = soldOut || !!chooseHint;
    const items = [{ productId: product.id, ...(variant && { variantId: variant.id }), slug: product.slug, quantity }];
    const quote = useQuery({
        queryKey: queryKeys.cart.quote(items, state),
        queryFn: () => shopService.quoteCart(items, state),
        enabled: !!state && !closed,
        placeholderData: (previous) => previous,
    });
    const line = quote.data?.sellers[0]?.lines[0];

    const add = () => {
        if (!addToCart({ productId: product.id, slug: product.slug, variantId: variant?.id }, quantity, product.stock)) {
            toast.error("Your cart is full. Check out or remove something first.");
            return;
        }
        const name = variant ? `${product.title} (${variant.label})` : product.title;
        toast.success(`${name} is in your cart.`, { action: { label: "View cart", onClick: () => router.push("/cart") } });
    };

    return (
        <section aria-label="Buy this product" className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-11 items-center rounded-button border border-border" role="group" aria-label="Quantity">
                    <button
                        type="button"
                        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                        disabled={quantity <= 1 || closed}
                        aria-label="One fewer"
                        className="flex size-11 cursor-pointer items-center justify-center text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Minus className="size-4" aria-hidden />
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
                        {quantity}
                    </span>
                    <button
                        type="button"
                        onClick={() => setQuantity((current) => Math.min(max, current + 1))}
                        disabled={quantity >= max || closed}
                        aria-label="One more"
                        className="flex size-11 cursor-pointer items-center justify-center text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Plus className="size-4" aria-hidden />
                    </button>
                </div>
                <Button type="button" onClick={add} disabled={closed} aria-describedby={chooseHint ? "choose-hint" : undefined} className={cn(PRIMARY_BUTTON_CLASS, CART_BUTTON_CLASS, CART_BUTTON_SOLD_OUT_CLASS, "flex-1 gap-2")}>
                    <ShoppingCart className="size-4" aria-hidden />
                    {soldOut ? "Sold out" : "Add to cart"}
                </Button>
                <WishlistHeart productId={product.id} title={product.title} className="size-11 border border-border shadow-none" />
            </div>

            {chooseHint && (
                <p id="choose-hint" className="text-sm text-neutral-700">
                    {chooseHint}
                </p>
            )}

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5 text-primary-700" aria-hidden />
                Secure checkout: {PAYMENT_METHODS.join(", ")}
            </p>

            {!soldOut && (
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                        <Truck className="size-4 text-primary-700" aria-hidden />
                        Delivery
                    </p>
                    <StateSelect value={state} />
                    {state && chooseHint ? (
                        <p className="text-sm text-muted-foreground">Choose your options to see what delivery costs.</p>
                    ) : state &&
                        (quote.isPending ? (
                            <Skeleton className="h-5 w-56" />
                        ) : quote.isError ? (
                            <p className="text-sm text-muted-foreground">We couldn&apos;t check delivery just now.</p>
                        ) : line?.problem === "no_delivery" ? (
                            <p className="text-sm text-error-700">
                                Not delivered to {state}
                                {line.pickup.available ? ", but you can collect it." : "."}
                            </p>
                        ) : line?.delivery ? (
                            <p className="text-sm text-neutral-700">
                                {line.delivery.feeKobo === 0 ? "Free delivery" : `${formatKobo(line.delivery.feeKobo)} delivery`} to {state}
                                {quantity > 1 ? ` for ${quantity}` : ""}, in about {line.delivery.etaDays} {line.delivery.etaDays === 1 ? "day" : "days"}
                                {product.stock === null ? " once it's made" : ""}.
                            </p>
                        ) : null)}
                    {line?.pickup.available && <p className="text-sm text-neutral-700">Or collect it free from {line.pickup.address}.</p>}
                </div>
            )}
        </section>
    );
}
