import axios from "axios";
import { cacheLife, cacheTag } from "next/cache";
import { API_BASE_URL } from "@/lib/site";
import { SHOP_PAGE_SIZE, type ProductSort } from "@/constant/shop";
import type { ProductDetail, ProductPage } from "@/lib/types/shop";

// Public catalogue reads for server-rendered pages. No cookies, no login:
// these are cached and shared by every visitor (SHOP_IMPLEMENTATION.md 10.3)
const publicApi = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

export type ProductListQuery = {
    page: number;
    sort: ProductSort;
    category?: string;
    subcategory?: string;
};

/** One page of listed products. Each page, sort and category is cached on its own. */
export async function getProductsPage(query: ProductListQuery): Promise<ProductPage> {
    "use cache";
    cacheLife("catalogue");
    cacheTag("products");
    if (query.category) cacheTag(`category:${query.category}`);

    const { data } = await publicApi.get<ProductPage>("/shop/products", {
        params: { ...query, limit: SHOP_PAGE_SIZE },
    });
    return data;
}

/**
 * One listed product, or null when it isn't on the shop (never listed, taken
 * down, or no such slug). Any other failure throws, so a page can tell "gone"
 * from "couldn't load".
 */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
    "use cache";
    cacheLife("catalogue");
    cacheTag("products", `product:${slug}`);

    try {
        const { data } = await publicApi.get<{ product: ProductDetail }>(`/shop/products/${encodeURIComponent(slug)}`);
        return data.product;
    } catch (error) {
        // 404: not on the shop; 422: a slug no product could have
        if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 422)) return null;
        throw error;
    }
}
