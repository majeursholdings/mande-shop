import axios from "axios";
import { cacheLife, cacheTag } from "next/cache";
import { API_BASE_URL } from "@/lib/site";
import { SHOP_PAGE_SIZE } from "@/constant/shop";
import type { Store, StorePage, StoreSort } from "@/lib/types/shop";

// Public store reads for server-rendered pages, cached and shared by every
// visitor like the products (SHOP_IMPLEMENTATION.md 10.3)
const publicApi = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

/** One page of stores with listed products. Each page and sort is cached on its own. */
export async function getStoresPage(query: { page: number; sort: StoreSort }): Promise<StorePage> {
    "use cache";
    cacheLife("catalogue");
    cacheTag("sellers");

    const { data } = await publicApi.get<StorePage>("/shop/sellers", { params: { ...query, limit: SHOP_PAGE_SIZE } });
    return data;
}

/** One store, or null when it isn't on the shop (no such store, or nothing listed). Any other failure throws. */
export async function getStore(slug: string): Promise<Store | null> {
    "use cache";
    cacheLife("catalogue");
    cacheTag("sellers", `seller:${slug}`);

    try {
        const { data } = await publicApi.get<{ seller: Store }>(`/shop/sellers/${encodeURIComponent(slug)}`);
        return data.seller;
    } catch (error) {
        if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 422)) return null;
        throw error;
    }
}
