import * as fs from "fs";
import { google, calendar_v3 } from "googleapis";

const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json";
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || "./token.json";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  attendees?: string[];
  location?: string;
  isAllDay: boolean;
}

function getAuthClient() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `credentials.json not found. Run "npm run auth" to set up Google Calendar access.`
    );
  }
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(
      `token.json not found. Run "npm run auth" to authorize the app.`
    );
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8")));
  return oAuth2Client;
}

function parseEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  const isAllDay = Boolean(event.start?.date && !event.start?.dateTime);
  return {
    id: event.id || "",
    title: event.summary || "(No title)",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    description: event.description || undefined,
    attendees: event.attendees
      ?.filter((a) => !a.self)
      .map((a) => a.displayName || a.email || "")
      .filter(Boolean),
    location: event.location || undefined,
    isAllDay,
  };
}

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items || []).map(parseEvent);
}

export async function getWeekEvents(): Promise<CalendarEvent[]> {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const now = new Date();
  // Start from today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // End 7 days from now
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfWeek.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items || []).map(parseEvent);
}
