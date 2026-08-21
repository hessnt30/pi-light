export type CalendarView = "week" | "month" | "day";
export type ThemeMode = "light" | "dark" | "system";
export type MemberRole = "owner" | "member";

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
};

export type DisplaySettings = {
  household_id: string;
  default_view: CalendarView;
  week_starts_on: 0 | 1;
  show_weather: boolean;
  show_clock: boolean;
  show_upcoming: boolean;
  theme: ThemeMode;
  timezone: string;
  weather_lat: number | null;
  weather_lon: number | null;
  updated_at: string;
};

export type GoogleAccountPublic = {
  id: string;
  household_id: string;
  connected_by_user_id: string;
  google_email: string;
  google_sub: string;
  created_at: string;
};

export type CalendarRecord = {
  id: string;
  google_account_id: string;
  google_calendar_id: string;
  name: string;
  color: string;
  enabled: boolean;
  is_primary: boolean;
  updated_at: string;
};

export const CALENDAR_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#06b6d4",
  "#a855f7",
  "#eab308",
  "#ef4444",
  "#14b8a6",
  "#64748b",
] as const;

export const DEFAULT_DISPLAY_SETTINGS: Omit<
  DisplaySettings,
  "household_id" | "updated_at"
> = {
  default_view: "week",
  week_starts_on: 0,
  show_weather: true,
  show_clock: true,
  show_upcoming: true,
  theme: "system",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  weather_lat: null,
  weather_lon: null,
};
