import { headers } from "next/headers";

export async function requestOrigin(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return {
    ip: forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  };
}
