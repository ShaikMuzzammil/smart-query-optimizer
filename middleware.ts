// middleware.ts — protect all dashboard + API routes
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Dashboard pages
    "/dashboard/:path*",
    "/optimizer/:path*",
    "/nl2sql/:path*",
    "/schema/:path*",
    "/playground/:path*",
    "/examples/:path*",
    "/history/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    // API routes
    "/api/optimize/:path*",
    "/api/nl2sql/:path*",
    "/api/queries/:path*",
    "/api/analytics/:path*",
    "/api/export/:path*",
    "/api/conversions/:path*",
  ],
};
