import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { data: accounts } = await auth.supabase
    .from("google_accounts")
    .select("id")
    .eq("household_id", auth.context.householdId);

  const accountIds = (accounts ?? []).map((a) => a.id);
  if (!accountIds.length) {
    return NextResponse.json({ calendars: [] });
  }

  const { data: calendars } = await auth.supabase
    .from("calendars")
    .select("*, google_accounts!inner(google_email)")
    .in("google_account_id", accountIds)
    .order("name");

  const enriched = (calendars ?? []).map((cal) => {
    const account = cal.google_accounts as unknown as
      | { google_email: string }
      | { google_email: string }[];
    const email = Array.isArray(account)
      ? account[0]?.google_email
      : account?.google_email;
    const { google_accounts: _, ...rest } = cal;
    return { ...rest, google_email: email };
  });

  return NextResponse.json({ calendars: enriched });
}
