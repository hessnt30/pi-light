export type CalendarEvent = {
  id: string;
  googleEventId: string;
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
  timezone?: string;
  htmlLink?: string;
  status: "confirmed" | "tentative" | "cancelled";
  isBirthday?: boolean;
};

export type CalendarView = "week" | "month" | "day";

export type LayoutEvent = CalendarEvent & {
  column: number;
  totalColumns: number;
};
