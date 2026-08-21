import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDisplaySettings, getHouseholdContext } from "@/lib/household/context";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { DEFAULT_DISPLAY_SETTINGS } from "@/lib/types/database";
import type { DisplaySettings } from "@/lib/types/database";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const context = await getHouseholdContext();
  if (!context) redirect("/login");

  const { data: settingsRow } = await supabase
    .from("display_settings")
    .select("*")
    .eq("household_id", context.householdId)
    .single();

  const { data: household } = await supabase
    .from("households")
    .select("id, name, invite_code")
    .eq("id", context.householdId)
    .single();

  const { data: accounts } = await supabase
    .from("google_accounts")
    .select("id, google_email, created_at")
    .eq("household_id", context.householdId);

  const settings: DisplaySettings = settingsRow ?? {
    household_id: context.householdId,
    ...DEFAULT_DISPLAY_SETTINGS,
    updated_at: new Date().toISOString(),
  };

  return (
    <Suspense>
      <SettingsPageClient
        initialSettings={settings}
        initialHousehold={household!}
        initialAccounts={accounts ?? []}
        role={context.role}
      />
    </Suspense>
  );
}
