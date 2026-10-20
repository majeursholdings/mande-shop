import Image from "next/image";
import type { Store } from "@/lib/types/shop";
import { cn } from "@/lib/utils";

/** The store's photo, MANDE's logo for MANDE stock, or the store's initials. */
export default function StoreAvatar({ store, size }: { store: Pick<Store, "name" | "kind" | "avatar">; size: "md" | "lg" }) {
    const box = size === "lg" ? "size-20 text-2xl" : "size-14 text-lg";
    if (store.kind === "mande") {
        return (
            <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-primary-950 p-3", box)}>
                <Image src="/MANDE-logo-white.png" alt="" width={236} height={56} className="h-auto w-full" />
            </span>
        );
    }
    if (store.avatar) {
        return (
            <span className={cn("relative shrink-0 overflow-hidden rounded-full bg-mist-100", box)}>
                <Image src={store.avatar.url} alt="" fill sizes={size === "lg" ? "80px" : "56px"} className="object-cover" />
            </span>
        );
    }
    const initials = store.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("");
    return <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-800", box)}>{initials || "?"}</span>;
}
