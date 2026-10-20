import { cacheLife, cacheTag } from "next/cache";
import { toPlainText, type PortableTextBlock } from "@portabletext/react";
import { SHOP_LEGAL_SLUGS, isShopLegalSlug } from "@/constant/legal";
import { cmsFetch } from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// Legal documents from the CMS's "legalDocument" type: the shop's ones only
// (constant/legal.ts). Their bodies are plain rich text: paragraphs, section
// headings, lists, bold, italic and links. Cached like the catalogue.
// ─────────────────────────────────────────────────────────────────────────────

export type LegalDocumentSummary = { slug: string; title: string; summary: string; /** ISO date of the last change in substance. */ updatedAt: string };
export type LegalDocument = LegalDocumentSummary & { body: PortableTextBlock[] };

// The CMS keeps "Last updated" as a calendar date; midday UTC keeps it the same day everywhere
const SUMMARY_FIELDS = `"slug": slug.current, title, summary, "updatedAt": updatedAt + "T12:00:00.000Z"`;

/** The shop's policies that are published, in the shop's order. */
export async function getLegalDocuments(): Promise<LegalDocumentSummary[]> {
    "use cache";
    cacheLife("catalogue");
    cacheTag("legal");
    const documents = await cmsFetch<LegalDocumentSummary[]>(`*[_type == "legalDocument" && slug.current in $slugs] { ${SUMMARY_FIELDS} }`, {
        slugs: [...SHOP_LEGAL_SLUGS],
    });
    return documents.sort((a, b) => SHOP_LEGAL_SLUGS.indexOf(a.slug as never) - SHOP_LEGAL_SLUGS.indexOf(b.slug as never));
}

/** One of the shop's policies with its text, or null when it isn't one or isn't published. */
export async function getLegalDocument(slug: string): Promise<LegalDocument | null> {
    "use cache";
    cacheLife("catalogue");
    cacheTag("legal", `legal:${slug}`);
    if (!isShopLegalSlug(slug)) return null;
    return cmsFetch<LegalDocument | null>(`*[_type == "legalDocument" && slug.current == $slug][0] { ${SUMMARY_FIELDS}, body }`, { slug });
}

/** "Getting paid" → "getting-paid", for headings' anchors. */
export const toAnchor = (text: string) =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

/** The document's section headings, for "On this page". */
export function getHeadings(body: PortableTextBlock[]): { id: string; text: string }[] {
    return body.filter((block) => block._type === "block" && block.style === "h2").map((block) => ({ id: toAnchor(toPlainText(block)), text: toPlainText(block) }));
}
