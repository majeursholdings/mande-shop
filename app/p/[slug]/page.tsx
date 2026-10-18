import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalogue/products";
import { productHref } from "@/constant/shop";
import ProductDetails, { ProductDetailsSkeleton } from "@/components/product/productDetails";

// Product slugs aren't known at build time, so there's no generateStaticParams:
// each page renders on request from the cached product read. The params are
// read inside <Suspense>, so the header shows at once and the product streams
// in. A product that's gone is a 404 page streamed after the header, so it
// keeps a 200 status with a noindex tag (see Next's notFound docs)

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
    let product;
    try {
        product = await getProduct((await params).slug);
    } catch {
        return {};
    }
    if (!product) return { robots: { index: false } };

    const description = (product.description || `${product.title}, sold by ${product.seller.name} on MANDE Shop.`).slice(0, 160);
    const cover = product.images[0];
    return {
        title: product.title,
        description,
        alternates: { canonical: productHref(product.slug) },
        openGraph: {
            title: product.title,
            description,
            url: productHref(product.slug),
            images: cover ? [{ url: cover.url, alt: cover.alt }] : undefined,
        },
    };
}

export default function ProductPage({ params }: PageProps<"/p/[slug]">) {
    return (
        <main className="flex-1 bg-mist-50 px-2.5 py-8 sm:px-6 md:py-12 lg:px-8">
            <Suspense fallback={<ProductDetailsSkeleton />}>
                <ProductContent params={params} />
            </Suspense>
        </main>
    );
}

async function ProductContent({ params }: Pick<PageProps<"/p/[slug]">, "params">) {
    const { slug } = await params;
    let product;
    try {
        product = await getProduct(slug);
    } catch {
        return (
            <p role="alert" className="container mx-auto rounded-xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">
                We couldn&apos;t load this product. Please refresh the page.
            </p>
        );
    }
    if (!product) notFound();
    return <ProductDetails product={product} />;
}
