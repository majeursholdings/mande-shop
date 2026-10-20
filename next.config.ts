import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Extra hostnames the dev server answers besides localhost, e.g. local
  // names from a proxy. Set only in your own .env.local
  allowedDevOrigins: (process.env.DEV_ORIGINS ?? "").split(",").map((host) => host.trim()).filter(Boolean),
  // Vercel compresses responses itself. Next's own compression only runs
  // locally, where it wraps the Sentry tunnel's proxied responses (below) and
  // sets off a MaxListenersExceededWarning on every page load
  compress: false,
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    // Public catalogue pages: refreshed in the background every 2 minutes.
    // Price and stock are checked again at checkout, so this is safe
    catalogue: { stale: 60, revalidate: 120, expire: 3600 },
  },
  images: {
    // Product, review and seller images come from the API as Cloudinary links
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSentryConfig(nextConfig, {
    org: "majeurs-holdings",
    project: "mande-shop",
    // Uploads source maps on production builds so errors show the real code.
    // Without the token (a local build) the upload is skipped.
    authToken: process.env.SENTRY_AUTH_TOKEN,
    widenClientFileUpload: true,
    // Browser events go through the shop first, so ad blockers don't drop them
    tunnelRoute: "/monitoring",
    silent: !process.env.CI,
});
