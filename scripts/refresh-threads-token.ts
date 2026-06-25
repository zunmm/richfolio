// Refresh a long-lived Threads access token (~60-day lifetime) for another
// ~60 days. Used by .github/workflows/refresh-threads-token.yml on a schedule
// so the token never silently expires.
//
// Contract for the workflow:
//   - On success: prints ONLY the new token to stdout (diagnostics go to stderr),
//     so the workflow can capture it and write it back to the secret.
//   - If THREADS_ACCESS_TOKEN is unset: prints nothing, exits 0 (nothing to do).
//   - On a real refresh failure (expired/invalid token): exits 1 so the workflow
//     fails loudly and you know to regenerate the token manually.

const token = process.env.THREADS_ACCESS_TOKEN;

(async () => {
  if (!token) {
    console.error("THREADS_ACCESS_TOKEN not set — nothing to refresh.");
    process.exit(0);
  }

  const res = await fetch(
    "https://graph.threads.net/v1.0/refresh_access_token" +
      `?grant_type=th_refresh_token&access_token=${token}`,
  );
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message: string };
  };

  if (!res.ok || !data.access_token) {
    console.error(`Threads token refresh failed (${res.status}):`, data.error?.message ?? "");
    process.exit(1);
  }

  console.error(
    `Threads token refreshed — valid ~${Math.round((data.expires_in ?? 0) / 86400)} days.`,
  );
  // Only the token on stdout — the workflow captures and re-stores it.
  process.stdout.write(data.access_token);
})();
