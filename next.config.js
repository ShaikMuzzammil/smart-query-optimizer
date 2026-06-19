/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Disable x-powered-by header
  poweredByHeader: false,
  // Compress responses
  compress: true,
  // Strict mode
  reactStrictMode: true,
};

module.exports = nextConfig;
