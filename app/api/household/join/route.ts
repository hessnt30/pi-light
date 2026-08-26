import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";

const joinSchema = z.object({
  invite_code: z.string().min(4),
});

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = joinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  const { data: household } = await auth.supabase
    .from("households")
    .select("id")
    .eq("invite_code", parsed.data.invite_code)
    .single();

  if (!household) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  if (household.id === auth.context.householdId) {
    return NextResponse.json({ error: "Already in this household" }, { status: 400 });
  }

  // Leave current household if member (not owner with others)
  await auth.supabase
    .from("household_members")
    .delete()
    .eq("user_id", auth.context.userId);

  const { error } = await auth.supabase.from("household_members").insert({
    household_id: household.id,
    user_id: auth.context.userId,
    role: "member",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ householdId: household.id });
}
