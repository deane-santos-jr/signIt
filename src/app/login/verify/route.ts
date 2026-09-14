import { and, eq, gt } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { loginTokens } from "@/db/schema";
import { setSessionCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  const [row] = await db
    .select()
    .from(loginTokens)
    .where(
      and(
        eq(loginTokens.token, token),
        eq(loginTokens.used, false),
        gt(loginTokens.expiresAt, new Date()),
      ),
    );
  if (!row) {
    return NextResponse.redirect(new URL("/login?expired=1", request.url));
  }

  await db
    .update(loginTokens)
    .set({ used: true })
    .where(eq(loginTokens.token, token));
  await setSessionCookie(row.email);
  return NextResponse.redirect(new URL("/admin", request.url));
}
