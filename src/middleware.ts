import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const path = nextUrl.pathname;

  const isAuthPage = path === "/login";
  const isEnrollPage = path.startsWith("/enroll");
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/favicon") ||
    path.startsWith("/manifest");

  if (isPublicAsset) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  const isLoggedIn = !!token;

  if (!isLoggedIn) {
    if (isAuthPage || isEnrollPage) return NextResponse.next();
    const url = new URL("/login", nextUrl);
    if (path !== "/") url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (path.startsWith("/admin") && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)"],
};
