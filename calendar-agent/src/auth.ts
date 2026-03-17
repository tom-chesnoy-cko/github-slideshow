/**
 * Run this once to authorize the app with your Google account:
 *   npm run auth
 * It will open a browser and save a token.json file for future use.
 */
import * as fs from "fs";
import * as readline from "readline";
import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json";
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || "./token.json";

async function authorize() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`
❌ credentials.json not found at: ${CREDENTIALS_PATH}

To set up Google Calendar access:
1. Go to https://console.cloud.google.com
2. Create a project (or select an existing one)
3. Enable the Google Calendar API
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "OAuth client ID"
6. Choose "Desktop app" as the application type
7. Download the JSON file and save it as credentials.json in this directory
8. Run: npm run auth
`);
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("\n🔗 Open this URL in your browser to authorize:\n");
  console.log(authUrl);
  console.log();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise<string>((resolve) =>
    rl.question("Paste the authorization code here: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log("\n✅ Authorization successful! token.json saved.\n");
}

authorize().catch(console.error);
