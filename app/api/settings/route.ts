import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";

const patchSchema = z.object({
  default_view: z.enum(["week", "month", "day"]).optional(),
  week_starts_on: z.union([z.literal(0), z.literal(1)]).optional(),
  show_weather: z.boolean().optional(),
  show_clock: z.boolean().optional(),
  show_upcoming: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  timezone: z.string().optional(),
  weather_lat: z.number().nullable().optional(),
  weather_lon: z.number().nullable().optional(),
});

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { data } = await auth.supabase
    .from("display_settings")
    .select("*")
    .eq("household_id", auth.context.householdId)
    .single();

  const { data: household } = await auth.supabase
    .from("households")
    .select("id, name, invite_code")
    .eq("id", auth.context.householdId)
    .single();

  const { data: accounts } = await auth.supabase
    .from("google_accounts")
    .select("id, google_email, created_at")
    .eq("household_id", auth.context.householdId);

  return NextResponse.json({
    settings: data,
    household,
    accounts: accounts ?? [],
    role: auth.context.role,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("display_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("household_id", auth.context.householdId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
