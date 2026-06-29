import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/signin",
    },
  }
);

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
    "/api/optimize/:path*",
    "/api/nl2sql/:path*",
    "/api/conversions/:path*",
    "/api/export/:path*",
  ],
};
