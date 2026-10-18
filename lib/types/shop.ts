/** The page details every shop list sends beside its items (SHOP_IMPLEMENTATION.md 5.6). */
export type PageInfo = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

/** A product as product cards show it, from GET /shop/products. */
export type ProductCardData = {
    id: string;
    slug: string;
    title: string;
    image: { url: string; alt?: string } | null;
    priceKobo: number;
    category: string;
    subcategory: string;
    rating: { average: number; count: number };
    /** null when made to order */
    stock: number | null;
    leadTimeDays: number | null;
    seller: { slug: string; name: string };
};

/** GET /shop/products */
export type ProductPage = PageInfo & { products: ProductCardData[] };

/** One listed product, from GET /shop/products/:slug. */
export type ProductDetail = Omit<ProductCardData, "image" | "seller"> & {
    description: string;
    images: { url: string; alt: string }[];
    listedAt: string | null;
    seller: {
        slug: string;
        name: string;
        kind: "manufacturer" | "mande";
        /** Where they're based, e.g. "Lagos"; empty when the seller hasn't said */
        state: string;
        rating: { average: number; count: number };
    };
};
