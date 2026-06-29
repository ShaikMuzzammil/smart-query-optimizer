// middleware.ts — Protect all authenticated routes
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/optimizer/:path*",
    "/nl2sql/:path*",
    "/schema/:path*",
    "/playground/:path*",
    "/examples/:path*",
    "/history/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/api/optimize",
    "/api/nl2sql",
    "/api/queries/:path*",
    "/api/analytics/:path*",
    "/api/export/:path*",
  ],
};
