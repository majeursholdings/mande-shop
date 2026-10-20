import Link from "next/link";
import { PortableText, toPlainText, type PortableTextBlock, type PortableTextComponents } from "@portabletext/react";
import { toAnchor } from "@/lib/cms/legal";

// A legal document's text from the CMS: paragraphs, section headings (with
// anchors for "On this page"), lists, bold, italic and links. Mirrors
// mande-frontend's components/common/richText.tsx for these blocks.

const TEXT = "text-base leading-7 text-neutral-700";
const LINK = "font-medium text-primary-700 underline underline-offset-4 hover:text-primary-900";

const components: PortableTextComponents = {
    block: {
        normal: ({ children }) => <p className={TEXT}>{children}</p>,
        h2: ({ children, value }) => (
            <h2 id={toAnchor(toPlainText(value))} className="mt-6 scroll-mt-24 text-xl font-semibold text-neutral-900 first:mt-0 md:text-2xl">
                {children}
            </h2>
        ),
    },
    list: {
        bullet: ({ children }) => <ul className={`${TEXT} flex list-disc flex-col gap-2 pl-6`}>{children}</ul>,
        number: ({ children }) => <ol className={`${TEXT} flex list-decimal flex-col gap-2 pl-6`}>{children}</ol>,
    },
    marks: {
        strong: ({ children }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
        link: ({ children, value }) => {
            const href: string = value?.href ?? "";
            return href.startsWith("/") ? (
                <Link href={href} className={LINK}>
                    {children}
                </Link>
            ) : (
                <a href={href} className={LINK} target="_blank" rel="noopener noreferrer">
                    {children}
                </a>
            );
        },
    },
};

export default function LegalText({ value }: { value: PortableTextBlock[] }) {
    return (
        <article className="flex flex-col gap-4">
            <PortableText value={value} components={components} />
        </article>
    );
}
