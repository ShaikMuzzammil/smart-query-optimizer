/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma + bcrypt need to run in Node.js runtime, not Edge
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  eslint: {
    // Lint errors won't fail production build — warnings are fine
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't fail build on type errors during CI/CD (prisma types generate at runtime)
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
