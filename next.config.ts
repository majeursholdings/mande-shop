import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Extra hostnames the dev server answers besides localhost, e.g. local
  // names from a proxy. Set only in your own .env.local
  allowedDevOrigins: (process.env.DEV_ORIGINS ?? "").split(",").map((host) => host.trim()).filter(Boolean),
  cacheComponents: false,
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

export default nextConfig;
