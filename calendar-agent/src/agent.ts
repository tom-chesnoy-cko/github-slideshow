import Anthropic from "@anthropic-ai/sdk";
import { CalendarEvent } from "./calendar";

const client = new Anthropic();

function formatEvents(events: CalendarEvent[]): string {
  if (events.length === 0) return "No events scheduled.";

  return events
    .map((e) => {
      const time = e.isAllDay
        ? `All day — ${e.start}`
        : `${new Date(e.start).toLocaleString()} → ${new Date(e.end).toLocaleTimeString()}`;
      const attendees =
        e.attendees && e.attendees.length > 0
          ? `\n   Attendees: ${e.attendees.join(", ")}`
          : "";
      const location = e.location ? `\n   Location: ${e.location}` : "";
      const description = e.description
        ? `\n   Notes: ${e.description.slice(0, 200)}`
        : "";
      return `- ${e.title}\n   ${time}${attendees}${location}${description}`;
    })
    .join("\n\n");
}

export async function getDailyBriefing(events: CalendarEvent[]): Promise<string> {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: `You are a personal productivity assistant. Your job is to analyze someone's calendar and help them prioritize their day.
Be concise, practical, and direct. Focus on what matters most and why.`,
    messages: [
      {
        role: "user",
        content: `Today is ${today}. Here are my meetings and events for today:

${formatEvents(events)}

Please give me:
1. **Top priorities** — what I should focus on most today and why (based on the meetings)
2. **Preparation tips** — what I should prepare or think about before key meetings
3. **Energy management** — when to do deep work vs. lighter tasks given my schedule
4. **One thing to watch out for** — any potential bottlenecks or conflicts

Keep it brief and actionable.`,
      },
    ],
  });

  const response = await stream.finalMessage();
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("\n");
}

export async function getWeeklyBriefing(events: CalendarEvent[]): Promise<string> {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 3000,
    thinking: { type: "adaptive" },
    system: `You are a personal productivity assistant. Your job is to analyze someone's upcoming week and help them prioritize effectively.
Be concise, strategic, and practical.`,
    messages: [
      {
        role: "user",
        content: `Today is ${today}. Here are my events for the next 7 days:

${formatEvents(events)}

Please give me:
1. **Weekly priorities** — the 3 most important things this week based on my calendar
2. **Heavy days** — which days are most meeting-heavy and will need the most energy
3. **Focus blocks** — when I likely have good windows for deep/focused work
4. **Key deadlines or prep** — anything I should prepare in advance
5. **Strategic advice** — one insight to make this week more effective

Keep it focused and actionable.`,
      },
    ],
  });

  const response = await stream.finalMessage();
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("\n");
}
