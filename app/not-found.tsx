import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
    return (
        <main className="flex flex-1 items-center justify-center bg-mist-50 px-2.5 py-20 sm:px-6">
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
                <SearchX className="size-10 text-mist-500" aria-hidden />
                <h1 className="text-2xl tracking-tight text-neutral-900">We couldn&apos;t find that page</h1>
                <p className="text-sm text-muted-foreground">
                    It may have been taken off the shop, or the link may be wrong. Have a look at the rest of the shop.
                </p>
                <Link
                    href="/"
                    className="inline-flex h-10 items-center rounded-button bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors duration-300 hover:bg-primary/80"
                >
                    Go to the shop
                </Link>
            </div>
        </main>
    );
}
