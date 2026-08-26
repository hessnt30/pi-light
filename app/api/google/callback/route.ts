import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode, storeGoogleAccount } from "@/lib/google/oauth";
import { syncCalendarsForAccount } from "@/lib/google/sync-calendars";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const cookieStore = await cookies();
  const storedRaw = cookieStore.get("google_oauth_state")?.value;

  if (!code || !state || !storedRaw) {
    return NextResponse.redirect(`${origin}/settings?error=oauth`);
  }

  let stored: { state: string; householdId: string; userId: string };
  try {
    stored = JSON.parse(storedRaw);
  } catch {
    return NextResponse.redirect(`${origin}/settings?error=oauth`);
  }

  if (stored.state !== state) {
    return NextResponse.redirect(`${origin}/settings?error=oauth`);
  }

  cookieStore.delete("google_oauth_state");

  try {
    const supabase = await createClient();
    const { tokens, email, sub } = await exchangeCode(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${origin}/settings?error=no_refresh`);
    }

    const accountId = await storeGoogleAccount(supabase, {
      householdId: stored.householdId,
      userId: stored.userId,
      email,
      sub,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });

    await syncCalendarsForAccount(supabase, accountId);
    return NextResponse.redirect(`${origin}/settings?connected=1`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/settings?error=oauth`);
  }
}
