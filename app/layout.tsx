import type { Metadata } from "next";
import { Toaster } from "sonner";
import { inter } from "./fonts";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SHOP_NAME, SHOP_URL } from "@/lib/site";
import { QueryProvider } from "@/components/providers/queryProvider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export const metadata: Metadata = {
  // Lets pages give relative canonical and Open Graph addresses
  metadataBase: new URL(SHOP_URL),
  title: {
    default: "MANDE Shop | Furniture from Nigerian makers",
    template: `%s | ${SHOP_NAME}`,
  },
  description:
    "Buy furniture straight from verified Nigerian manufacturers and from MANDE, with delivery across Nigeria.",
  applicationName: SHOP_NAME,
  openGraph: { siteName: SHOP_NAME, locale: "en_NG", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full antialiased", inter.variable, inter.className)}>
      <body className={cn("min-h-full flex flex-col font-sans", inter.className)}>
        <QueryProvider>
          <Header />
          {children}
          <Footer />
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
