import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getHouseholdContext } from "@/lib/household/context";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const context = await getHouseholdContext();
  if (!context) {
    return {
      error: NextResponse.json({ error: "No household" }, { status: 403 }),
    };
  }

  return { user, context, supabase };
}
