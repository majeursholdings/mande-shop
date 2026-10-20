import Link from "next/link";
import { MAIN_SITE_URL } from "@/lib/site";

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-white/10 bg-primary-950 px-2.5 py-10 text-mist-100/80 sm:px-6 lg:px-8">
            <div className="container mx-auto flex flex-col gap-6 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p>MANDE Shop. Furniture from verified Nigerian manufacturers.</p>
                <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
                    <Link href="/sellers" className="transition-colors duration-300 hover:text-white">
                        Sellers
                    </Link>
                    <a href={MAIN_SITE_URL} className="transition-colors duration-300 hover:text-white">
                        mande.com.ng
                    </a>
                    <Link href="/support" className="transition-colors duration-300 hover:text-white">
                        Help and support
                    </Link>
                    <Link href="/legal" className="transition-colors duration-300 hover:text-white">
                        Terms and policies
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
