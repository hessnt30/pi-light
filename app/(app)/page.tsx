import { getDisplaySettings, getHouseholdContext } from "@/lib/household/context";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { DEFAULT_DISPLAY_SETTINGS } from "@/lib/types/database";
import type { DisplaySettings } from "@/lib/types/database";

export default async function DashboardPage() {
  const context = await getHouseholdContext();
  if (!context) return null;

  const settings = (await getDisplaySettings(context.householdId)) as DisplaySettings | null;

  const displaySettings: DisplaySettings = settings ?? {
    household_id: context.householdId,
    ...DEFAULT_DISPLAY_SETTINGS,
    updated_at: new Date().toISOString(),
  };

  return <DashboardClient settings={displaySettings} />;
}
