import "dotenv/config";

// Threads posting smoke test.
//
//   npx tsx smoke/smoke-threads.ts                  # verifies the token (no posting)
//   npx tsx smoke/smoke-threads.ts --post           # publishes a real test post
//   npx tsx smoke/smoke-threads.ts --post --cleanup # publishes then deletes it
//
// Reads THREADS_USER_ID / THREADS_ACCESS_TOKEN from .env. Hits the live Threads
// API — run manually, not in CI. The token needs the threads_basic and
// threads_content_publish scopes.

const BASE = "https://graph.threads.net/v1.0";
const USER_ID = process.env.THREADS_USER_ID;
const TOKEN = process.env.THREADS_ACCESS_TOKEN;

const doPost = process.argv.includes("--post");
const doCleanup = process.argv.includes("--cleanup");

(async () => {
  if (!TOKEN) {
    console.log("FAIL — THREADS_ACCESS_TOKEN missing from .env");
    process.exit(1);
  }

  // 1. Token + identity check (no publishing). Resolves the Threads user id —
  //    handy on first run when you have the token but not yet the id.
  const meRes = await fetch(`${BASE}/me?fields=id,username&access_token=${TOKEN}`);
  const me = (await meRes.json()) as {
    id?: string;
    username?: string;
    error?: { message: string };
  };
  if (!meRes.ok || me.error || !me.id) {
    console.log("FAIL — token rejected:", me.error?.message ?? meRes.status);
    process.exit(1);
  }
  console.log(`Token OK → @${me.username} (id ${me.id})`);

  if (!USER_ID) {
    console.log(`\nSet this in .env, then re-run:\n  THREADS_USER_ID=${me.id}`);
    return;
  }
  if (me.id !== USER_ID) {
    console.log(`FAIL — token resolves to id ${me.id} but THREADS_USER_ID is ${USER_ID}.`);
    process.exit(1);
  }
  console.log("User ID matches THREADS_USER_ID.");

  if (!doPost) {
    console.log("\nPASS — credentials valid. Re-run with --post to publish a real test post.");
    return;
  }

  // 2. Two-step publish: create text container, then publish it.
  const text = "✅ Richfolio Threads smoke test — safe to delete.";
  const createRes = await fetch(`${BASE}/${USER_ID}/threads`, {
    method: "POST",
    body: new URLSearchParams({ media_type: "TEXT", text, access_token: TOKEN }),
  });
  const created = (await createRes.json()) as { id?: string; error?: { message: string } };
  if (!createRes.ok || !created.id) {
    console.log("FAIL — create container:", created.error?.message ?? createRes.status);
    process.exit(1);
  }
  const pubRes = await fetch(`${BASE}/${USER_ID}/threads_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: created.id, access_token: TOKEN }),
  });
  const pub = (await pubRes.json()) as { id?: string; error?: { message: string } };
  if (!pubRes.ok || !pub.id) {
    console.log("FAIL — publish:", pub.error?.message ?? pubRes.status);
    process.exit(1);
  }
  console.log(`Posted → media id ${pub.id}`);

  if (doCleanup) {
    const delRes = await fetch(`${BASE}/${pub.id}?access_token=${TOKEN}`, { method: "DELETE" });
    const del = (await delRes.json().catch(() => ({}))) as {
      success?: boolean;
      error?: { message: string };
    };
    console.log(
      delRes.ok || del.success
        ? "Cleanup OK — test post deleted."
        : `Cleanup not completed (Threads may not allow API delete): ${del.error?.message ?? delRes.status}`,
    );
  }

  console.log("\nPASS — Threads posting works end-to-end.");
})();
