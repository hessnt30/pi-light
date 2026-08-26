import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/api/auth";
import { getAuthUrl } from "@/lib/google/oauth";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const state = randomBytes(16).toString("hex");
  const payload = JSON.stringify({
    state,
    householdId: auth.context.householdId,
    userId: auth.context.userId,
  });

  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getAuthUrl(state));
}
