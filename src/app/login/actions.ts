"use server";

import { z } from "zod";
import { db } from "@/db";
import { loginTokens } from "@/db/schema";
import { sendLoginLink } from "@/lib/email";
import { env } from "@/lib/env";
import { newToken } from "@/lib/ids";

const LOGIN_MINUTES = 15;

const schema = z.object({ email: z.string().email() });

export type LoginState = { sent: boolean; error?: string };

export async function requestLoginLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { sent: false, error: "Enter a valid email." };

  const email = parsed.data.email.toLowerCase();
  if (email !== env.adminEmail()) return { sent: true };

  const token = newToken();
  await db.insert(loginTokens).values({
    token,
    email,
    expiresAt: new Date(Date.now() + LOGIN_MINUTES * 60 * 1000),
  });
  await sendLoginLink(email, `${env.appUrl()}/login/verify?token=${token}`);
  return { sent: true };
}
