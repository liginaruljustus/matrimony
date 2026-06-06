import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

export default withAuth(
  function middleware(request: NextRequest) {
    const token = (request as any).nextauth.token;
    const pathname = request.nextUrl.pathname;

    // Check admin-only routes - redirect non-admins to dashboard
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Note: T&C check is handled client-side in useEffect hooks
    // and via layout/page components for better performance in Edge Runtime
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profiles/:path*",
    "/chat/:path*",
    "/admin/:path*",
    "/favorites/:path*",
    "/matches/:path*",
    "/terms/:path*",
  ],
};
