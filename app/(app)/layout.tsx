import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDisplaySettings, getHouseholdContext } from "@/lib/household/context";
import { ThemeProvider } from "@/lib/hooks/useTheme";
import type { ThemeMode } from "@/lib/types/database";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const context = await getHouseholdContext();
  const settings = context
    ? await getDisplaySettings(context.householdId)
    : null;

  const theme = (settings?.theme ?? "system") as ThemeMode;

  return (
    <ThemeProvider initialTheme={theme}>
      <div className="flex min-h-screen flex-col bg-background">{children}</div>
    </ThemeProvider>
  );
}
