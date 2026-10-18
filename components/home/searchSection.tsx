import { Search } from "lucide-react";

/**
 * The home page's search bar. A plain GET form to /search, so it works
 * before (and without) any JavaScript.
 */
export default function SearchSection() {
    return (
        <section className="bg-primary-950 px-2.5 pt-10 pb-14 sm:px-6 md:pt-16 md:pb-20 lg:px-8">
            <div className="container mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
                <h1 className="text-3xl tracking-tight text-white md:text-5xl">Furniture made in Nigeria</h1>
                <p className="max-w-xl text-base text-mist-100/80 md:text-lg">
                    Buy straight from verified manufacturers and from MANDE, delivered across Nigeria.
                </p>

                <form action="/search" role="search" className="flex w-full gap-2">
                    <label htmlFor="shop-search" className="sr-only">
                        Search the shop
                    </label>
                    <div className="relative flex-1">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400"
                            aria-hidden
                        />
                        <input
                            id="shop-search"
                            name="q"
                            type="search"
                            required
                            maxLength={100}
                            placeholder="Search beds, sofas, office chairs..."
                            className="h-12 w-full rounded-button border border-transparent bg-white pr-3 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus-visible:ring-3 focus-visible:ring-primary-400/60"
                        />
                    </div>
                    <button
                        type="submit"
                        className="h-12 shrink-0 rounded-button bg-primary-500 px-5 text-base font-medium text-primary-950 transition-colors duration-300 hover:bg-primary-200 focus-visible:ring-3 focus-visible:ring-primary-300 outline-none"
                    >
                        Search
                    </button>
                </form>
            </div>
        </section>
    );
}
