import * as dotenv from "dotenv";
dotenv.config();

import { getTodayEvents, getWeekEvents } from "./calendar";
import { getDailyBriefing, getWeeklyBriefing } from "./agent";

const MODE = process.argv[2] || "today";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.");
    process.exit(1);
  }

  if (MODE === "today") {
    console.log("📅 Fetching today's events...\n");
    const events = await getTodayEvents();
    console.log(`Found ${events.length} event(s) today.\n`);
    console.log("🤔 Analyzing your day...\n");
    console.log("─".repeat(60));
    const briefing = await getDailyBriefing(events);
    console.log(briefing);
    console.log("─".repeat(60));
  } else if (MODE === "week") {
    console.log("📅 Fetching this week's events...\n");
    const events = await getWeekEvents();
    console.log(`Found ${events.length} event(s) this week.\n`);
    console.log("🤔 Analyzing your week...\n");
    console.log("─".repeat(60));
    const briefing = await getWeeklyBriefing(events);
    console.log(briefing);
    console.log("─".repeat(60));
  } else {
    console.error(`Unknown mode: "${MODE}". Use "today" or "week".`);
    console.error("Usage: npm run dev [today|week]");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
