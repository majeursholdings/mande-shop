import Link from "next/link";
import { categoryHref, getShopSubcategory, sellerHref, subcategoryHref } from "@/constant/shop";
import { getProductReviews } from "@/lib/catalogue/products";
import { SHOP_URL } from "@/lib/site";
import type { ProductDetail } from "@/lib/types/shop";
import Breadcrumbs, { type Crumb } from "@/components/layout/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import RelatedProducts, { RelatedProductsSkeleton } from "./relatedProducts";
import ReportProduct from "./reportProduct";
import ReviewsSection, { ReviewsSectionSkeleton } from "./reviewsSection";
import SellerCard from "./sellerCard";
import { VariantAvailability, VariantGallery, VariantPicker, VariantPrice, VariantProvider, VariantPurchase, VariantTrustPanel } from "./productVariants";
import RatingSummary from "./ratingSummary";

/** How many reviews go in the product data: the first page of /p/[slug]/reviews. */
const JSON_LD_REVIEWS = 10;

/**
 * Product data for search engines (schema.org Product), so results can show
 * the price, stock and rating, with the first page of reviews. Streamed in its
 * own Suspense boundary so the reviews read never holds up the page; if it
 * fails, the data goes out without them.
 */
async function ProductJsonLd({ product }: { product: ProductDetail }) {
    const reviews =
        product.rating.count > 0
            ? await getProductReviews(product.slug, { page: 1, sort: "newest", limit: JSON_LD_REVIEWS })
                  .then((page) => page?.reviews ?? [])
                  .catch(() => [])
            : [];
    const data = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description || undefined,
        image: product.images.map((image) => image.url),
        sku: product.id,
        url: `${SHOP_URL}/p/${product.slug}`,
        // With variants at different prices, the range they cost
        offers: {
            ...(product.priceMaxKobo !== null && product.priceMaxKobo > product.priceKobo
                ? {
                      "@type": "AggregateOffer",
                      lowPrice: (product.priceKobo / 100).toFixed(2),
                      highPrice: (product.priceMaxKobo / 100).toFixed(2),
                      offerCount: product.variants.length,
                  }
                : { "@type": "Offer", price: (product.priceKobo / 100).toFixed(2) }),
            priceCurrency: "NGN",
            availability:
                product.stock === null
                    ? "https://schema.org/MadeToOrder"
                    : product.stock > 0
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: product.seller.name },
        },
        ...(product.rating.count > 0 && {
            aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count },
        }),
        ...(reviews.length > 0 && {
            review: reviews.map((review) => ({
                "@type": "Review",
                author: { "@type": "Person", name: review.author },
                datePublished: review.createdAt.slice(0, 10),
                reviewBody: review.body || undefined,
                reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
            })),
        }),
    };
    // "<" escaped so text in the product can't close the script tag
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export default function ProductDetails({ product }: { product: ProductDetail }) {
    const place = getShopSubcategory(product.category, product.subcategory);
    const crumbs: Crumb[] = [
        { label: "Home", href: "/" },
        ...(place
            ? [
                  { label: place.category.name, href: categoryHref(place.category.slug) },
                  { label: place.subcategory.name, href: subcategoryHref(place.category.slug, place.subcategory.slug) },
              ]
            : []),
        { label: product.title },
    ];

    return (
        <div className="container mx-auto flex flex-col gap-6">
            <Suspense fallback={null}>
                <ProductJsonLd product={product} />
            </Suspense>
            <Breadcrumbs items={crumbs} />

            {/* The gallery, price, stock, "Add to cart" and returns follow the variant chosen */}
            <VariantProvider
                product={{
                    id: product.id,
                    slug: product.slug,
                    title: product.title,
                    priceKobo: product.priceKobo,
                    priceMaxKobo: product.priceMaxKobo,
                    stock: product.stock,
                    leadTimeDays: product.leadTimeDays,
                    images: product.images,
                    changeOfMindReturns: product.changeOfMindReturns,
                    options: product.options ?? [],
                    variants: product.variants ?? [],
                }}
            >
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                    <VariantGallery />

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl tracking-tight text-neutral-900 md:text-3xl">{product.title}</h1>
                            <p className="text-sm text-muted-foreground">
                                Sold by{" "}
                                <Link href={sellerHref(product.seller.slug)} className="font-medium text-primary-700 hover:underline">
                                    {product.seller.name}
                                </Link>
                            </p>
                            <a href="#reviews" className="self-start rounded outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50">
                                <RatingSummary rating={product.rating} />
                            </a>
                        </div>

                        <VariantPrice />
                        <VariantPicker />
                        <VariantAvailability />
                        <VariantPurchase />

                        <SellerCard seller={product.seller} />
                        <VariantTrustPanel />

                        {product.description && (
                            <section aria-labelledby="description-heading" className="flex flex-col gap-2 border-t border-border pt-5">
                                <h2 id="description-heading" className="text-lg font-medium text-neutral-900">
                                    About this product
                                </h2>
                                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{product.description}</p>
                            </section>
                        )}
                        <ReportProduct slug={product.slug} title={product.title} />
                    </div>
                </div>
            </VariantProvider>

            <Suspense fallback={<ReviewsSectionSkeleton />}>
                <ReviewsSection slug={product.slug} />
            </Suspense>
            <Suspense fallback={<RelatedProductsSkeleton />}>
                <RelatedProducts slug={product.slug} sellerName={product.seller.name} />
            </Suspense>
        </div>
    );
}

/** The product page while it loads: shaped like the gallery and the details beside it. */
export function ProductDetailsSkeleton() {
    return (
        <div className="container mx-auto flex flex-col gap-6" aria-hidden>
            <Skeleton className="h-5 w-64" />
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                <Skeleton className="aspect-square rounded-xl" />
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-9 w-3/4" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-9 w-36" />
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        </div>
    );
}
