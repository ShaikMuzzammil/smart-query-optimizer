/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ["@prisma/client", "prisma"] },
  images: { domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"] },
  optimizeFonts: false,
};
module.exports = nextConfig;
