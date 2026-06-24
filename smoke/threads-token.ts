import "dotenv/config";

// One-shot helper: turn a short-lived Threads token into a long-lived one
// (~60 days) and print your Threads user id.
//
// Set these in .env temporarily, then run `npx tsx smoke/threads-token.ts`:
//   THREADS_SHORT_TOKEN   — a short-lived token from the Threads API use case
//                           (scopes: threads_basic, threads_content_publish)
//   THREADS_APP_SECRET    — App settings → Basic → App secret
//
// Paste the printed token into THREADS_ACCESS_TOKEN and the id into
// THREADS_USER_ID, then delete THREADS_SHORT_TOKEN and THREADS_APP_SECRET.
//
// Note: Threads long-lived tokens expire in ~60 days. Refresh before expiry:
//   GET https://graph.threads.net/v1.0/refresh_access_token
//       ?grant_type=th_refresh_token&access_token=LONG_LIVED_TOKEN

const BASE = "https://graph.threads.net/v1.0";
const APP_SECRET = process.env.THREADS_APP_SECRET;
const SHORT_TOKEN = process.env.THREADS_SHORT_TOKEN;

(async () => {
  if (!APP_SECRET || !SHORT_TOKEN) {
    console.log("Need THREADS_APP_SECRET and THREADS_SHORT_TOKEN in .env");
    process.exit(1);
  }

  const exRes = await fetch(
    `${BASE}/access_token?grant_type=th_exchange_token` +
      `&client_secret=${APP_SECRET}&access_token=${SHORT_TOKEN}`,
  );
  const ex = (await exRes.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message: string };
  };
  if (!exRes.ok || !ex.access_token) {
    console.log("FAIL — token exchange:", ex.error?.message ?? exRes.status);
    process.exit(1);
  }

  const meRes = await fetch(`${BASE}/me?fields=id,username&access_token=${ex.access_token}`);
  const me = (await meRes.json()) as { id?: string; username?: string };

  console.log(`\nThreads account: @${me.username} (id ${me.id})`);
  console.log(`Long-lived token valid ~${Math.round((ex.expires_in ?? 0) / 86400)} days.\n`);
  console.log("=== Paste into .env ===\n");
  console.log(`THREADS_USER_ID=${me.id}`);
  console.log(`THREADS_ACCESS_TOKEN=${ex.access_token}`);
  console.log("\n(Then remove THREADS_SHORT_TOKEN and THREADS_APP_SECRET from .env.)");
})();
