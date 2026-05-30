import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const path = nextUrl.pathname;

  const isAuthPage = path === "/login";
  const isEnrollPage = path.startsWith("/enroll");
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/favicon") ||
    path.startsWith("/manifest");

  if (isPublicAsset) return NextResponse.next();

  if (!isLoggedIn) {
    if (isAuthPage || isEnrollPage) return NextResponse.next();
    const url = new URL("/login", nextUrl);
    if (path !== "/") url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (path.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)"],
};
