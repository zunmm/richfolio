import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Types ───────────────────────────────────────────────────────────
export type MacroEventType = "CPI" | "NFP" | "FOMC" | "PCE";

export interface MacroEvent {
  /** YYYY-MM-DD (UTC date, no time component — release timing details vary by agency) */
  date: string;
  type: MacroEventType;
  /** Number of full days from today to event date. 0 = today, 1 = tomorrow, negative = past. */
  daysUntil: number;
}

// Typical 1-day moves on a surprise print. Educational reminder for the user,
// not a forecast. Ranges are historical ballpark — not precise — so the email
// banner gives a concrete sense of "what am I betting against" when deciding
// whether to enter pre-event.
const TYPICAL_MOVES: Record<MacroEventType, string> = {
  CPI: "typical 1d move on surprise: ±1–2% S&P, ±2–3% gold, ±0.10–0.15 DXY",
  NFP: "typical 1d move on surprise: ±0.5–1.5% S&P, ±0.10–0.20 DXY, ±5–10bp 10Y",
  FOMC: "typical 1d move: ±0.5–2% S&P, ±0.5–1% gold, ±0.20 DXY",
  PCE: "typical 1d move on surprise: ±0.5–1% S&P, ±1–2% gold",
};

const EVENT_FULL_NAMES: Record<MacroEventType, string> = {
  CPI: "CPI (inflation print)",
  NFP: "NFP (jobs report)",
  FOMC: "FOMC decision",
  PCE: "PCE (Fed's preferred inflation gauge)",
};

// ── Load ────────────────────────────────────────────────────────────
// Reads macro-calendar.json from repo root. Returns only events in the
// future (or today) within a 14-day window — anything beyond is too far
// to matter for daily-brief framing.
export function loadMacroCalendar(): MacroEvent[] {
  try {
    const path = resolve(process.cwd(), "macro-calendar.json");
    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw) as { events?: Array<{ date: string; type: string }> };
    if (!data.events || !Array.isArray(data.events)) return [];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const events: MacroEvent[] = [];
    for (const e of data.events) {
      if (!isMacroEventType(e.type)) continue;
      const eventDate = new Date(e.date + "T00:00:00Z");
      if (isNaN(eventDate.getTime())) continue;
      const daysUntil = Math.round((eventDate.getTime() - todayMs) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0 || daysUntil > 14) continue;
      events.push({ date: e.date, type: e.type, daysUntil });
    }
    events.sort((a, b) => a.daysUntil - b.daysUntil);
    return events;
  } catch {
    // Missing/malformed calendar is non-fatal — just no banner this run.
    return [];
  }
}

function isMacroEventType(s: string): s is MacroEventType {
  return s === "CPI" || s === "NFP" || s === "FOMC" || s === "PCE";
}

// ── Format helpers ─────────────────────────────────────────────────

function formatDayLabel(daysUntil: number): string {
  if (daysUntil === 0) return "TODAY";
  if (daysUntil === 1) return "in 1 day";
  return `in ${daysUntil} days`;
}

/** Plain-text banner for email subtitle / Telegram body. */
export function formatMacroEventsBanner(events: MacroEvent[]): string {
  if (events.length === 0) return "";
  const lines = ["⚠ Macro events this week:"];
  // Show up to 3 — past that gets noisy and they're too far to matter
  for (const e of events.slice(0, 3)) {
    lines.push(
      `• ${e.date} (${formatDayLabel(e.daysUntil)}) — ${EVENT_FULL_NAMES[e.type]} — ${TYPICAL_MOVES[e.type]}`,
    );
  }
  return lines.join("\n");
}

/** HTML banner block for email rendering. */
export function formatMacroEventsBannerHtml(
  events: MacroEvent[],
  styles: { bg: string; border: string; yellow: string; muted: string; text: string },
): string {
  if (events.length === 0) return "";
  const rows = events
    .slice(0, 3)
    .map((e) => {
      const urgent = e.daysUntil <= 2;
      const dayColor = urgent ? styles.yellow : styles.muted;
      return `
    <tr>
      <td style="padding:4px 12px 4px 0;white-space:nowrap;font-size:11px;color:${dayColor};font-weight:${urgent ? "bold" : "normal"};">${formatDayLabel(e.daysUntil)}</td>
      <td style="padding:4px 12px 4px 0;white-space:nowrap;font-size:11px;color:${styles.text};font-weight:bold;">${EVENT_FULL_NAMES[e.type]}</td>
      <td style="padding:4px 0;font-size:11px;color:${styles.muted};">${TYPICAL_MOVES[e.type]}</td>
    </tr>`;
    })
    .join("");
  return `
<tr><td style="padding:8px 24px;background:${styles.bg};border-left:3px solid ${styles.yellow};">
  <div style="font-size:11px;color:${styles.yellow};font-weight:bold;text-transform:uppercase;margin-bottom:4px;">⚠ Upcoming macro events</div>
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows}
  </table>
</td></tr>`;
}

/**
 * Append a macro events block to the existing macro context string for the AI
 * prompt. Soft-advisory — the AI is told to acknowledge but NOT auto-cap.
 * The user retains decision authority; events are awareness, not enforcement.
 */
export function formatMacroEventsForPrompt(events: MacroEvent[]): string {
  if (events.length === 0) return "";
  const lines = ["", "MACRO EVENT CALENDAR (upcoming US releases):"];
  for (const e of events.slice(0, 5)) {
    lines.push(`- ${EVENT_FULL_NAMES[e.type]} ${formatDayLabel(e.daysUntil)} (${e.date})`);
  }
  lines.push("");
  lines.push(
    "When a tier-1 macro event is within 2 days, surface this fact in the reason field for any STRONG BUY and acknowledge the binary event risk. You may reduce confidence by ~5pts for affected instruments (gold, bonds, rate-sensitive equities) but this is NOT a hard cap — the user retains authority and may want to enter pre-event when their macro view is strong. Be informative, not paternalistic.",
  );
  return lines.join("\n");
}
