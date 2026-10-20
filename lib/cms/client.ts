import { createClient, type QueryParams } from "@sanity/client";

// ─────────────────────────────────────────────────────────────────────────────
// The Sanity CMS (the studio is in ../mande-sanity), the same project and
// dataset mande.com.ng reads. Published content only. Callers cache what
// they read with "use cache" (lib/cms/legal.ts), like the catalogue.
// ─────────────────────────────────────────────────────────────────────────────

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "iprkoda4",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: "2026-10-01",
    useCdn: true,
    perspective: "published",
});

export function cmsFetch<T>(query: string, params: QueryParams = {}): Promise<T> {
    return client.fetch<T>(query, params);
}
