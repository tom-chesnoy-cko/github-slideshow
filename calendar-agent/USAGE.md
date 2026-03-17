# Calendar Agent — Usage Guide

An AI assistant that reads your Google Calendar and tells you what to prioritize each day and week.

## What it does

- **Daily briefing** (`npm run dev today`): Analyzes today's meetings and tells you your top priorities, how to prepare, and when to do focused work.
- **Weekly briefing** (`npm run dev week`): Looks at the next 7 days and gives you a strategic overview — heavy days, focus windows, and key deadlines.

---

## Setup (one time)

### 1. Install dependencies

```bash
cd calendar-agent
npm install
```

### 2. Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy `.env.example` to `.env` and paste your key:

```bash
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=your_key_here
```

### 3. Set up Google Calendar access

**a. Create a Google Cloud project**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Calendar API** (APIs & Services → Library → search "Calendar")

**b. Create OAuth2 credentials**

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Choose **Desktop app** as the application type
4. Download the JSON file
5. Save it as `credentials.json` in the `calendar-agent/` directory

**c. Authorize the app (opens your browser)**

```bash
npm run auth
```

Follow the prompts — it will save a `token.json` file. You only need to do this once.

---

## Running the agent

**Get today's briefing:**
```bash
npm run dev today
# or just:
npm run dev
```

**Get a weekly overview:**
```bash
npm run dev week
```

**Example output (daily):**
```
📅 Fetching today's events...

Found 4 event(s) today.

🤔 Analyzing your day...

────────────────────────────────────────────────────────────
**Top priorities**
Your 10am product review with the engineering team is the most
critical meeting today — come prepared with the Q2 metrics...

**Preparation tips**
- For the 2pm client call: review the proposal sent last Tuesday
- For standup: have your blockers ready upfront

**Energy management**
You have a clear block 12–1pm — use it for deep work before
the afternoon gets meeting-heavy.

**One thing to watch out for**
Back-to-back meetings from 2–4pm may leave you drained for
the 4:30 review. Consider a 5-minute break between them.
────────────────────────────────────────────────────────────
```

---

## Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point — parses `today`/`week` argument |
| `src/calendar.ts` | Fetches events from Google Calendar API |
| `src/agent.ts` | Sends events to Claude for analysis |
| `src/auth.ts` | One-time OAuth2 authorization flow |
| `.env` | Your API keys (not committed) |
| `credentials.json` | Google OAuth2 credentials (not committed) |
| `token.json` | Google auth token (auto-generated, not committed) |

---

## Troubleshooting

**"credentials.json not found"**
→ Download it from Google Cloud Console (see step 3b above)

**"token.json not found"**
→ Run `npm run auth`

**"ANTHROPIC_API_KEY is not set"**
→ Copy `.env.example` to `.env` and add your key

**Token expired**
→ Delete `token.json` and run `npm run auth` again
