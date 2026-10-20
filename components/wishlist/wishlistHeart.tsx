"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { LOGIN_URL, withNext } from "@/constant/auth";
import { useWishlistIds } from "@/hooks/useWishlist";
import { getErrorMessage } from "@/lib/api";
import { setPendingWishlistSave } from "@/lib/pendingWishlist";
import { queryKeys } from "@/lib/queryKeys";
import { shopService } from "@/lib/services/shopService";
import { cn } from "@/lib/utils";

/**
 * The heart that saves a product to the wishlist. Filled when it's saved.
 * Signed out, it remembers the product and sends them to sign in, which
 * saves it and brings them back here. Saving is safe to tap twice.
 */
export default function WishlistHeart({ productId, title, className }: { productId: string; title: string; className?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const { ids, signedIn } = useWishlistIds();
    const [busy, setBusy] = useState(false);
    const saved = ids.has(productId);

    const toggle = async () => {
        if (!signedIn) {
            setPendingWishlistSave(productId);
            router.push(withNext(LOGIN_URL, pathname));
            return;
        }
        setBusy(true);
        // Shown straight away, and put back if the API says no
        const key = queryKeys.customer.wishlistIds();
        const before = queryClient.getQueryData<Set<string>>(key) ?? new Set<string>();
        const after = new Set(before);
        if (saved) after.delete(productId);
        else after.add(productId);
        queryClient.setQueryData(key, after);
        try {
            if (saved) await shopService.removeFromWishlist(productId);
            else await shopService.saveToWishlist(productId);
            void queryClient.invalidateQueries({ queryKey: queryKeys.customer.wishlistAll() });
        } catch (error) {
            queryClient.setQueryData(key, before);
            toast.error(getErrorMessage(error, "We couldn't update your wishlist. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${title} from your wishlist` : `Save ${title} to your wishlist`}
            className={cn(
                "flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-sm outline-none transition-colors hover:text-secondary-700 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-wait",
                className,
            )}
        >
            <Heart className={cn("size-4.5", saved && "fill-secondary-700 text-secondary-700")} aria-hidden />
        </button>
    );
}
