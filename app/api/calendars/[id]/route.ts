import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  name: z.string().min(1).max(100).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data: calendar } = await auth.supabase
    .from("calendars")
    .select("id, google_account_id, google_accounts!inner(household_id)")
    .eq("id", id)
    .single();

  if (!calendar) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const googleAccount = calendar.google_accounts as unknown as {
    household_id: string;
  } | { household_id: string }[];
  const householdId = Array.isArray(googleAccount)
    ? googleAccount[0]?.household_id
    : googleAccount?.household_id;

  if (householdId !== auth.context.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await auth.supabase
    .from("calendars")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ calendar: data });
}
