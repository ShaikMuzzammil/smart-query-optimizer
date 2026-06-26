// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/optimizer/:path*",
    "/history/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/api/optimize/:path*",
    "/api/queries/:path*",
    "/api/analytics/:path*",
    "/api/export/:path*",
  ],
};
