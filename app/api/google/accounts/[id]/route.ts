import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { revokeAndDeleteAccount } from "@/lib/google/oauth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const { data: account } = await auth.supabase
    .from("google_accounts")
    .select("id, household_id")
    .eq("id", id)
    .single();

  if (!account || account.household_id !== auth.context.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await revokeAndDeleteAccount(auth.supabase, id);
  return NextResponse.json({ success: true });
}
