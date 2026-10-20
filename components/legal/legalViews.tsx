import Link from "next/link";
import { FileText } from "lucide-react";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { LEGAL_URL, SUPPORT_EMAIL, legalHref } from "@/constant/legal";
import { getHeadings, type LegalDocument, type LegalDocumentSummary } from "@/lib/cms/legal";
import LegalText from "./legalText";

const DATE = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });

/** The shop's policies as a list of links (the Legal page, and the account's Legal section). */
export function LegalList({ documents }: { documents: LegalDocumentSummary[] | null }) {
    if (documents === null) return <p className="text-sm text-muted-foreground">We couldn&apos;t load our policies just now. Please refresh the page.</p>;
    if (documents.length === 0) return <p className="text-sm text-muted-foreground">Our policies will be here soon.</p>;
    return (
        <ul className="flex flex-col gap-3">
            {documents.map((document) => (
                <li key={document.slug}>
                    <Link href={legalHref(document.slug)} className="flex gap-3 rounded-xl border border-border bg-white p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/40">
                        <FileText className="mt-0.5 size-5 shrink-0 text-primary-700" aria-hidden />
                        <span className="flex flex-col gap-1">
                            <span className="font-medium text-neutral-900">{document.title}</span>
                            <span className="text-sm text-muted-foreground">{document.summary}</span>
                            <span className="text-xs text-muted-foreground">Updated {DATE.format(new Date(document.updatedAt))}</span>
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export function LegalListSkeleton() {
    return (
        <div className="flex flex-col gap-3" aria-hidden>
            {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
        </div>
    );
}

/** One policy: its title and date, "On this page", and the text. */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
    const headings = getHeadings(document.body);
    return (
        <div className="container mx-auto flex flex-col gap-6">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Legal", href: LEGAL_URL }, { label: document.title }]} />
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl tracking-tight text-neutral-900 md:text-4xl">{document.title}</h1>
                <p className="text-sm text-muted-foreground">Last updated {DATE.format(new Date(document.updatedAt))}</p>
            </div>
            <div className="flex gap-10">
                <div className="min-w-0 max-w-3xl flex-1 rounded-2xl border border-border bg-white p-6 md:p-8">
                    <LegalText value={document.body} />
                    <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
                        Questions about this policy? Email{" "}
                        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary-700 hover:underline">
                            {SUPPORT_EMAIL}
                        </a>
                        .
                    </p>
                </div>
                {headings.length > 0 && (
                    <nav aria-label="On this page" className="sticky top-24 hidden h-fit w-60 shrink-0 flex-col gap-2 lg:flex">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
                        <ul className="flex flex-col gap-1.5 text-sm">
                            {headings.map((heading) => (
                                <li key={heading.id}>
                                    <a href={`#${heading.id}`} className="text-neutral-700 hover:text-primary-700">
                                        {heading.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
            </div>
        </div>
    );
}

export function LegalDocumentSkeleton() {
    return (
        <div className="container mx-auto flex flex-col gap-6" aria-hidden>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-96 w-full max-w-3xl rounded-2xl" />
        </div>
    );
}
