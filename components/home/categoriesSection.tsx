import Link from "next/link";
import { SHOP_CATEGORIES } from "@/constant/shop";

/** Every category, linking to its page. From constants, so it's part of the static shell. */
export default function CategoriesSection() {
    return (
        <section aria-labelledby="categories-heading" className="px-2.5 pt-12 sm:px-6 md:pt-16 lg:px-8">
            <div className="container mx-auto">
                <h2 id="categories-heading" className="text-2xl tracking-tight text-neutral-900 md:text-3xl">
                    Shop by category
                </h2>

                <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
                    {SHOP_CATEGORIES.map(({ slug, name, icon: Icon }) => (
                        <li key={slug}>
                            <Link
                                href={`/c/${slug}`}
                                className="group flex h-full flex-col items-center gap-3 rounded-xl border border-border bg-white px-2 py-5 text-center outline-none transition-colors duration-300 hover:border-primary-300 hover:bg-primary-50 focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                <span className="flex size-12 items-center justify-center rounded-full bg-mist-100 text-primary-700 transition-colors duration-300 group-hover:bg-white">
                                    <Icon className="size-6" aria-hidden />
                                </span>
                                <span className="text-sm font-medium text-neutral-800">{name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
