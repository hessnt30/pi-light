import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_DISPLAY_SETTINGS } from "@/lib/types/database";

export type HouseholdContext = {
  householdId: string;
  role: "owner" | "member";
  userId: string;
};

export async function getHouseholdContext(): Promise<HouseholdContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership) {
    return {
      householdId: membership.household_id,
      role: membership.role as "owner" | "member",
      userId: user.id,
    };
  }

  return provisionHousehold(user.id, user.email ?? "My Household");
}

export async function provisionHousehold(
  userId: string,
  name: string,
): Promise<HouseholdContext> {
  const supabase = await createClient();
  const householdId = randomUUID();

  const { error: householdError } = await supabase.from("households").insert({
    id: householdId,
    name: `${name.split("@")[0]}'s Household`,
  });

  if (householdError) {
    throw new Error(householdError.message);
  }

  const { error: memberError } = await supabase
    .from("household_members")
    .insert({
      household_id: householdId,
      user_id: userId,
      role: "owner",
    });

  if (memberError) {
    throw new Error(memberError.message);
  }

  const { error: settingsError } = await supabase
    .from("display_settings")
    .insert({
      household_id: householdId,
      ...DEFAULT_DISPLAY_SETTINGS,
      timezone:
        DEFAULT_DISPLAY_SETTINGS.timezone || "America/New_York",
    });

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  return { householdId, role: "owner", userId };
}

export async function getDisplaySettings(householdId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("display_settings")
    .select("*")
    .eq("household_id", householdId)
    .single();

  return data;
}
