import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_LINK_CLASS =
    "flex h-9 min-w-9 items-center justify-center rounded-button border border-border bg-white px-3 text-sm text-neutral-800 outline-none transition-colors duration-300 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";

/** Page numbers to show: the first, the last, and the current one with its neighbours; gaps become "…". */
function pageWindow(current: number, total: number): (number | "gap")[] {
    const pages = new Set([1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total));
    const sorted = [...pages].sort((a, b) => a - b);
    return sorted.flatMap((page, index) => (index > 0 && page - sorted[index - 1] > 1 ? ["gap" as const, page] : [page]));
}

/**
 * Numbered page links. Each is a real `?page=` link, so pages can be shared
 * and crawled (SHOP_IMPLEMENTATION.md 10.2). `hrefFor` builds a page's link,
 * keeping the list's other parameters.
 */
export default function Pagination({
    page,
    totalPages,
    hrefFor,
}: {
    page: number;
    totalPages: number;
    hrefFor: (page: number) => string;
}) {
    if (totalPages <= 1) return null;

    return (
        <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-1.5">
            {page > 1 && (
                <Link href={hrefFor(page - 1)} rel="prev" className={PAGE_LINK_CLASS}>
                    <ChevronLeft className="size-4" aria-hidden />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
                </Link>
            )}

            {pageWindow(page, totalPages).map((item, index) =>
                item === "gap" ? (
                    <span key={`gap-${index}`} className="px-1 text-muted-foreground" aria-hidden>
                        …
                    </span>
                ) : (
                    <Link
                        key={item}
                        href={hrefFor(item)}
                        aria-label={`Page ${item}`}
                        aria-current={item === page ? "page" : undefined}
                        className={cn(
                            PAGE_LINK_CLASS,
                            item === page && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                        )}
                    >
                        {item}
                    </Link>
                ),
            )}

            {page < totalPages && (
                <Link href={hrefFor(page + 1)} rel="next" className={PAGE_LINK_CLASS}>
                    <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
                    <ChevronRight className="size-4" aria-hidden />
                </Link>
            )}
        </nav>
    );
}
