import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDisplaySettings, getHouseholdContext } from "@/lib/household/context";
import { ThemeProvider } from "@/lib/hooks/useTheme";
import { coerceTheme } from "@/lib/themes";

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

  const theme = coerceTheme(settings?.theme);

  return (
    <ThemeProvider initialTheme={theme}>
      <div className="flex min-h-screen flex-col">{children}</div>
    </ThemeProvider>
  );
}
