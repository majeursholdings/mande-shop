import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SHOP_CATEGORIES, getShopSubcategory, subcategoryHref } from "@/constant/shop";
import { listCanonical } from "@/lib/seo";
import CategoryView, { CategoryViewSkeleton } from "@/components/category/categoryView";

// Every subcategory is known up front, so each one's page is prerendered
export function generateStaticParams() {
    return SHOP_CATEGORIES.flatMap((category) => category.subcategories.map((sub) => ({ category: category.slug, subcategory: sub.slug })));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/c/[category]/[subcategory]">): Promise<Metadata> {
    const { category: categorySlug, subcategory: subcategorySlug } = await params;
    const found = getShopSubcategory(categorySlug, subcategorySlug);
    if (!found) return {};
    const { category, subcategory } = found;
    const href = subcategoryHref(category.slug, subcategory.slug);
    const description = `Shop ${subcategory.name.toLowerCase()} from verified Nigerian manufacturers and MANDE, delivered across Nigeria.`;
    return {
        title: `${subcategory.name} | ${category.name}`,
        description,
        alternates: { canonical: listCanonical(href, await searchParams) },
        openGraph: { title: subcategory.name, description, url: href },
    };
}

export default function SubcategoryPage({ params, searchParams }: PageProps<"/c/[category]/[subcategory]">) {
    return (
        <main className="flex-1 bg-mist-50 px-2.5 py-8 sm:px-6 md:py-12 lg:px-8">
            <Suspense fallback={<CategoryViewSkeleton />}>
                <SubcategoryContent params={params} searchParams={searchParams} />
            </Suspense>
        </main>
    );
}

async function SubcategoryContent({ params, searchParams }: Pick<PageProps<"/c/[category]/[subcategory]">, "params" | "searchParams">) {
    const { category, subcategory } = await params;
    const found = getShopSubcategory(category, subcategory);
    if (!found) notFound();
    return <CategoryView category={found.category} subcategory={found.subcategory} searchParams={searchParams} />;
}
