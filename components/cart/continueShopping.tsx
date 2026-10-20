import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Back to the shop from the cart or checkout, without losing anything (the cart stays as it is). */
export default function ContinueShopping() {
    return (
        <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-button border border-border bg-white px-4 text-sm font-medium text-neutral-800 outline-none transition-colors duration-300 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
            <ArrowLeft className="size-4" aria-hidden />
            Continue shopping
        </Link>
    );
}
