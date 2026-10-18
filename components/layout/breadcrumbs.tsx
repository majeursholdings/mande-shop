import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/** Where a page sits in the shop. The last crumb is the page itself, so it isn't a link. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                {items.map((item, index) => (
                    <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                        {index > 0 && <ChevronRight className="size-3.5" aria-hidden />}
                        {item.href ? (
                            <Link href={item.href} className="transition-colors duration-300 hover:text-primary-700">
                                {item.label}
                            </Link>
                        ) : (
                            <span aria-current="page" className="text-neutral-800">
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
