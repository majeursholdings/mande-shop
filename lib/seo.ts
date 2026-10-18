import { parsePage, parseProductSort } from "@/constant/shop";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * A list page's canonical address (SHOP_IMPLEMENTATION.md 10.3): page 2
 * onwards is its own page, but a sorted or filtered version points at the
 * plain list, so search engines index one copy of each page.
 */
export function listCanonical(basePath: string, searchParams: SearchParams): string {
    const page = parsePage(searchParams.page);
    const sorted = parseProductSort(Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort) !== "recommended";
    return page > 1 && !sorted ? `${basePath}?page=${page}` : basePath;
}
