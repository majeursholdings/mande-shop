import { Search } from "lucide-react";

/**
 * The search page's own box: a plain GET form to /search, prefilled with the
 * words searched for, so it works without JavaScript. Searching again starts
 * on page 1, keeping the category when one is chosen.
 */
export default function SearchBox({ q, category }: { q: string; category?: string }) {
    return (
        <form action="/search" role="search" className="flex w-full gap-2">
            <label htmlFor="search-page-box" className="sr-only">
                Search the shop
            </label>
            <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" aria-hidden />
                <input
                    id="search-page-box"
                    name="q"
                    type="search"
                    defaultValue={q}
                    required
                    minLength={2}
                    maxLength={100}
                    autoFocus={!q}
                    placeholder="Search beds, sofas, office chairs..."
                    className="h-12 w-full rounded-button border border-border bg-white pr-3 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus-visible:border-primary-400 focus-visible:ring-3 focus-visible:ring-primary-400/40"
                />
            </div>
            {category && <input type="hidden" name="category" value={category} />}
            <button
                type="submit"
                className="h-12 shrink-0 rounded-button bg-primary px-5 text-base font-medium text-primary-foreground outline-none transition-colors duration-300 hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
                Search
            </button>
        </form>
    );
}
