import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/"];
const publicRoutes = ["/login"];
const PUBLIC_FILE = /\.(?:ico|png|jpg|jpeg|svg|webp|gif|txt|xml|json|woff2?)$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get("provider_access_token")?.value;

  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route) && !publicRoutes.includes(pathname));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};
