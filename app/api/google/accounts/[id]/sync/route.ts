import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { syncCalendarsForAccount } from "@/lib/google/sync-calendars";

export async function POST(
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

  const count = await syncCalendarsForAccount(auth.supabase, id);
  return NextResponse.json({ synced: count });
}
