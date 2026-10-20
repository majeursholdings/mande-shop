"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { queryKeys } from "@/lib/queryKeys";
import { shopService } from "@/lib/services/shopService";

const EMPTY = new Set<string>();

/**
 * The products on the signed-in customer's wishlist, as a set of ids, for
 * filling in every heart on a page from one small request (so catalogue
 * pages stay the same for everyone, SHOP_IMPLEMENTATION.md 10.3). Empty when
 * signed out.
 */
export function useWishlistIds(): { ids: Set<string>; signedIn: boolean; isPending: boolean } {
    const { customer, isPending: customerPending } = useCurrentCustomer();
    const query = useQuery({
        queryKey: queryKeys.customer.wishlistIds(),
        queryFn: async () => new Set(await shopService.wishlistIds()),
        enabled: !!customer,
        staleTime: 60 * 1000,
    });
    return { ids: query.data ?? EMPTY, signedIn: !!customer, isPending: customerPending || (!!customer && query.isPending) };
}
