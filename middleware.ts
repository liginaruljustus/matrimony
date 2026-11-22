import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

// Public pages a signed-in member is sent past, straight to their Dashboard.
// (The login page does the same itself — NextAuth's middleware never runs on its sign-in page.)
const SKIP_WHEN_SIGNED_IN = new Set(["/"]);

export default withAuth(
  function middleware(request: NextRequest) {
    const token = (request as any).nextauth.token;
    const pathname = request.nextUrl.pathname;

    // Already signed in → open the Dashboard instead of the home / login page
    if (token && SKIP_WHEN_SIGNED_IN.has(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

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
      // The home page stays open to visitors; everything else here needs a sign-in
      authorized: ({ token, req }) => SKIP_WHEN_SIGNED_IN.has(req.nextUrl.pathname) || !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/profiles/:path*",
    "/chat/:path*",
    "/admin/:path*",
    "/favorites/:path*",
    "/matches/:path*",
    "/terms/:path*",
  ],
};
