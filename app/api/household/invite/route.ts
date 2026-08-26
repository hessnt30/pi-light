import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { randomBytes } from "crypto";

export async function POST() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  if (auth.context.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const inviteCode = randomBytes(6).toString("hex");

  const { data, error } = await auth.supabase
    .from("households")
    .update({ invite_code: inviteCode })
    .eq("id", auth.context.householdId)
    .select("invite_code")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invite_code: data.invite_code });
}
