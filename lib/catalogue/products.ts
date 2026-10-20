import axios from "axios";
import { cacheLife, cacheTag } from "next/cache";
import { API_BASE_URL } from "@/lib/site";
import { SHOP_PAGE_SIZE, type ProductSort } from "@/constant/shop";
import type { ProductDetail, ProductPage, ProductReviewPage, RelatedProducts, ReviewSort } from "@/lib/types/shop";

// Public catalogue reads for server-rendered pages. No cookies, no login:
// these are cached and shared by every visitor (SHOP_IMPLEMENTATION.md 10.3)
const publicApi = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

export type ProductListQuery = {
    page: number;
    sort: ProductSort;
    category?: string;
    subcategory?: string;
    /** A store's slug: only its products. */
    seller?: string;
};

/** One page of listed products. Each page, sort and category is cached on its own. */
export async function getProductsPage(query: ProductListQuery): Promise<ProductPage> {
    "use cache";
    cacheLife("catalogue");
    cacheTag("products");
    if (query.category) cacheTag(`category:${query.category}`);
    if (query.seller) cacheTag(`seller:${query.seller}`);

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

/**
 * A page of search results. Not cached: every search is different, so the
 * search page renders on each request (SHOP_IMPLEMENTATION.md 10.3). The API
 * answers with the best match first under "recommended".
 */
export async function searchProducts(query: ProductListQuery & { q: string }): Promise<ProductPage> {
    const { data } = await publicApi.get<ProductPage>("/shop/products", {
        params: { ...query, limit: SHOP_PAGE_SIZE },
    });
    return data;
}

/** The product page's suggestions: what goes with it, upgrades, more from the seller, similar. Cached with the product. */
export async function getRelatedProducts(slug: string): Promise<RelatedProducts | null> {
    "use cache";
    cacheLife("catalogue");
    cacheTag("products", `product:${slug}`);

    try {
        const { data } = await publicApi.get<RelatedProducts>(`/shop/products/${encodeURIComponent(slug)}/related`);
        return data;
    } catch (error) {
        if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 422)) return null;
        throw error;
    }
}

export type ReviewQuery = { page: number; sort: ReviewSort; stars?: number; withPhotos?: boolean; limit?: number };

/** A page of a product's published reviews with the star breakdown, or null when the product isn't on the shop. Each page and filter is cached. */
export async function getProductReviews(slug: string, query: ReviewQuery): Promise<ProductReviewPage | null> {
    "use cache";
    cacheLife("catalogue");
    cacheTag("reviews", `product:${slug}`, `reviews:${slug}`);

    try {
        const { data } = await publicApi.get<ProductReviewPage>(`/shop/products/${encodeURIComponent(slug)}/reviews`, {
            params: {
                page: query.page,
                sort: query.sort,
                limit: query.limit ?? 10,
                ...(query.stars && { stars: query.stars }),
                ...(query.withPhotos && { withPhotos: "true" }),
            },
        });
        return data;
    } catch (error) {
        if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 422)) return null;
        throw error;
    }
}
