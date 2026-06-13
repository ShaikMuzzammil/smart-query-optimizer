/** @type {import('next').NextConfig} */
const nextConfig = {
  // mongoose and natural ship native/optional submodules that don't need to
  // be (and shouldn't be) bundled by webpack for server components - load
  // them as regular node_modules requires at runtime instead.
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'natural'],
  },
  // Note: secrets (NEXTAUTH_SECRET, MONGODB_URI, GEMINI_API_KEY, etc.) are
  // intentionally NOT listed here. Server-side code can read them directly
  // via process.env - adding them to the `env` key would make Next.js
  // statically inline them, which is unnecessary and risks exposing them to
  // the client bundle if ever referenced from client code.
};

module.exports = nextConfig;
