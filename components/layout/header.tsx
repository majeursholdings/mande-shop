import Image from "next/image";
import Link from "next/link";
import { Heart, Search } from "lucide-react";
import CartLink from "./cartLink";
import AccountMenu from "./accountMenu";

const ICON_LINK_CLASS =
    "flex size-10 items-center justify-center rounded-button text-mist-100/80 outline-none transition-colors duration-300 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-300";

// ─────────────────────────────────────────────────────────────────────────────
// The shop header, in the website's dark green: the logo, then wishlist, cart
// and account. It's part of every page's static shell, so nothing here
// depends on who is visiting: the account link and the cart count are small
// client components (accountMenu.tsx, cartLink.tsx; SHOP_IMPLEMENTATION.md 10.3).
// ─────────────────────────────────────────────────────────────────────────────

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-primary-950 px-2.5 sm:px-6 lg:px-8">
            <div className="container mx-auto flex h-16 items-center justify-between gap-5">
                <Link
                    href="/"
                    aria-label="MANDE Shop, go to the homepage"
                    className="flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                >
                    <Image
                        src="/MANDE-logo-white.png"
                        alt=""
                        width={236}
                        height={56}
                        priority
                        className="aspect-118/28 w-24 sm:w-28"
                    />
                    <span className="rounded-full bg-primary-500 px-2 py-0.5 text-xs font-medium text-primary-950">Shop</span>
                </Link>

                <nav aria-label="Your shop" className="flex items-center gap-1">
                    <Link
                        href="/sellers"
                        className="mr-1 hidden rounded-button px-3 py-2 text-sm font-medium text-mist-100/80 outline-none transition-colors duration-300 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-300 sm:block"
                    >
                        Sellers
                    </Link>
                    <Link href="/search" aria-label="Search the shop" className={ICON_LINK_CLASS}>
                        <Search className="size-5" aria-hidden />
                    </Link>
                    <Link href="/wishlist" aria-label="Wishlist" className={ICON_LINK_CLASS}>
                        <Heart className="size-5" aria-hidden />
                    </Link>
                    <CartLink className={ICON_LINK_CLASS} />
                    <AccountMenu className={ICON_LINK_CLASS} />
                </nav>
            </div>
        </header>
    );
}
