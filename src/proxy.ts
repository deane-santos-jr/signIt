import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName, verifySessionValue } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const session = request.cookies.get(sessionCookieName)?.value;
  const email = await verifySessionValue(session);
  if (email) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/documents/:path*"],
};
