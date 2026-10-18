"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_SORTS, parseProductSort, type ProductSort } from "@/constant/shop";

/**
 * The list's sort, kept in the URL (`?sort=`). Changing it goes back to page 1,
 * and leaves "Recommended" out of the URL since it's the default.
 */
export default function SortSelect() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const sort = parseProductSort(searchParams.get("sort"));

    function changeSort(next: ProductSort) {
        const params = new URLSearchParams(searchParams);
        params.delete("page");
        if (next === "recommended") params.delete("sort");
        else params.set("sort", next);
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }

    return (
        <Select<ProductSort, false> items={PRODUCT_SORTS} value={sort} onValueChange={(next) => next && changeSort(next)}>
            <SelectTrigger aria-label="Sort products" className="h-10 w-48 rounded-button bg-white px-3 text-sm">
                <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
                {PRODUCT_SORTS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm">
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
