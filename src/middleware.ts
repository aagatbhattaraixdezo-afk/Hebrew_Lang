import { NextResponse } from "next/server";
import { auth } from "@/lib/auth.edge";

type AuthUser = {
  role?: "ADMIN" | "LEARNER";
};

export default auth((req) => {
  const { nextUrl } = req;
  let path = nextUrl.pathname;

  if (path === "/homepage" || path === "/home") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Public static files must not require auth (manifest as HTML breaks PWA parse).
  if (
    path === "/manifest.webmanifest" ||
    path === "/robots.txt" ||
    path.endsWith(".webmanifest")
  ) {
    return NextResponse.next();
  }

  const isAuthPage = path === "/login";
  const isEnrollPage = path.startsWith("/enroll");
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as AuthUser | undefined)?.role;

  if (!isLoggedIn) {
    if (isAuthPage || isEnrollPage) return NextResponse.next();
    const url = new URL("/login", nextUrl);
    const from = path === "/homepage" || path === "/home" ? "/" : path;
    if (from !== "/") url.searchParams.set("from", from);
    return NextResponse.redirect(url);
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Do not run on /api/auth — otherwise sign-in cannot set the session cookie.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest\\.webmanifest|robots\\.txt|.*\\.(?:png|jpg|jpeg|svg|webp|ico|webmanifest)).*)",
  ],
};
