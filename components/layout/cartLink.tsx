"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

/** The header's cart link, with how many items are in this browser's cart. */
export default function CartLink({ className }: { className: string }) {
    const count = useCart().reduce((sum, item) => sum + item.quantity, 0);
    return (
        <Link href="/cart" aria-label={count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"} className={`relative ${className}`}>
            <ShoppingCart className="size-5" aria-hidden />
            {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary-500 px-1 text-[0.65rem] font-semibold text-primary-950" aria-hidden>
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Link>
    );
}
