import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDisplaySettings, getHouseholdContext } from "@/lib/household/context";
import { DisplayClient } from "@/components/display/DisplayClient";
import { ThemeProvider } from "@/lib/hooks/useTheme";
import { DEFAULT_DISPLAY_SETTINGS } from "@/lib/types/database";
import type { DisplaySettings, ThemeMode } from "@/lib/types/database";

export default async function DisplayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const context = await getHouseholdContext();
  if (!context) redirect("/login");

  const settings = (await getDisplaySettings(
    context.householdId,
  )) as DisplaySettings | null;

  const displaySettings: DisplaySettings = settings ?? {
    household_id: context.householdId,
    ...DEFAULT_DISPLAY_SETTINGS,
    updated_at: new Date().toISOString(),
  };

  const theme = displaySettings.theme as ThemeMode;

  return (
    <ThemeProvider initialTheme={theme}>
      <div className="h-screen bg-background">
        <DisplayClient settings={displaySettings} />
      </div>
    </ThemeProvider>
  );
}
