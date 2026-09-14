import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";

export const ADMIN_SETTINGS_ID = "admin";

export async function loadAdminSignature() {
  const [row] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.id, ADMIN_SETTINGS_ID));
  return row ?? null;
}
