import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // /study was an orphaned duplicate of the whole app: a 4,184-line copy of
  // the pre-redesign root page with its own view switch, no shell and no
  // inbound links. It is deleted; this keeps any bookmark or external link
  // landing on the real app instead of a 404.
  async redirects() {
    return [{ source: "/study", destination: "/", permanent: false }];
  },
};

export default nextConfig;
