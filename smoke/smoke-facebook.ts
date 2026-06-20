import "dotenv/config";

// Facebook Page posting smoke test.
//
//   npx tsx smoke/smoke-facebook.ts            # non-destructive: verifies the
//                                              # token + Page ID only
//   npx tsx smoke/smoke-facebook.ts --post     # also publishes a real test post
//   npx tsx smoke/smoke-facebook.ts --post --cleanup
//                                              # publishes then deletes it
//
// Reads FACEBOOK_PAGE_ID / FACEBOOK_PAGE_TOKEN from .env. Hits the live Graph
// API — run manually, not in CI.

const GRAPH = "https://graph.facebook.com/v25.0";
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const PAGE_TOKEN = process.env.FACEBOOK_PAGE_TOKEN;

const doPost = process.argv.includes("--post");
const doCleanup = process.argv.includes("--cleanup");

(async () => {
  if (!PAGE_ID || !PAGE_TOKEN) {
    console.log("FAIL — FACEBOOK_PAGE_ID and/or FACEBOOK_PAGE_TOKEN missing from .env");
    process.exit(1);
  }

  // 1. Token + identity check (no publishing). id/name are safe on both User
  //    and Page nodes; category only exists on a Page, so we use it to detect
  //    a User-token mixup.
  const meRes = await fetch(`${GRAPH}/me?fields=id,name&access_token=${PAGE_TOKEN}`);
  const me = (await meRes.json()) as { id?: string; name?: string; error?: { message: string } };
  if (!meRes.ok || me.error) {
    console.log("FAIL — token rejected:", me.error?.message ?? meRes.status);
    process.exit(1);
  }
  console.log(`Token OK → resolves to: ${me.name} (id ${me.id})`);

  if (me.id !== PAGE_ID) {
    console.log(
      `\nFAIL — this token resolves to id ${me.id}, but FACEBOOK_PAGE_ID is ${PAGE_ID}.\n` +
        "That usually means FACEBOOK_PAGE_TOKEN is a USER token, not a PAGE token.\n" +
        "Fix: in Graph API Explorer run `me/accounts`, copy your Page's `access_token`\n" +
        "(after exchanging for a long-lived user token), and use THAT as FACEBOOK_PAGE_TOKEN.",
    );
    process.exit(1);
  }
  console.log("Page ID matches FACEBOOK_PAGE_ID — this is a valid Page token.");

  if (!doPost) {
    console.log("\nPASS — credentials valid. Re-run with --post to publish a real test post.");
    return;
  }

  // 2. Real publish to the feed (this is what the daily/intraday flow does).
  const message = "✅ Richfolio Facebook smoke test — safe to delete.";
  const postRes = await fetch(`${GRAPH}/${PAGE_ID}/feed`, {
    method: "POST",
    body: new URLSearchParams({ message, access_token: PAGE_TOKEN }),
  });
  const post = (await postRes.json()) as { id?: string; error?: { message: string } };
  if (!postRes.ok || post.error || !post.id) {
    console.log("FAIL — publish rejected:", post.error?.message ?? postRes.status);
    process.exit(1);
  }
  console.log(`Posted → id ${post.id}  (https://facebook.com/${post.id})`);

  if (doCleanup) {
    const delRes = await fetch(`${GRAPH}/${post.id}`, {
      method: "DELETE",
      body: new URLSearchParams({ access_token: PAGE_TOKEN }),
    });
    const del = (await delRes.json()) as { success?: boolean; error?: { message: string } };
    console.log(
      del.success ? "Cleanup OK — test post deleted." : `Cleanup failed: ${del.error?.message}`,
    );
  }

  console.log("\nPASS — Facebook posting works end-to-end.");
})();
