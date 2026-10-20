import type { ProductSort } from "@/constant/shop";

/** A search address with these words, sort, category and page (defaults left out). */
export function searchHref(q: string, options: { sort?: ProductSort; category?: string; page?: number } = {}) {
    const query = new URLSearchParams({ q });
    if (options.category) query.set("category", options.category);
    if (options.sort && options.sort !== "recommended") query.set("sort", options.sort);
    if (options.page && options.page > 1) query.set("page", String(options.page));
    return `/search?${query.toString()}`;
}
