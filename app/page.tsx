import SearchSection from "@/components/home/searchSection";
import CategoriesSection from "@/components/home/categoriesSection";
import ProductsSection from "@/components/home/productsSection";

export default function HomePage({ searchParams }: PageProps<"/">) {
    return (
        <main className="flex flex-1 flex-col bg-mist-50">
            <SearchSection />
            <CategoriesSection />
            <ProductsSection searchParams={searchParams} />
        </main>
    );
}
