export function startOfDay(d: Date | string): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** YYYY-MM-DD in local time (not UTC — avoids day-shifting for timezones east of UTC). */
export function dayKey(d: Date | string): string {
  const x = startOfDay(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shortLabel(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Builds an array of the last `days` day-keys (oldest first), ending today. */
export function lastNDayKeys(days: number): string[] {
  const out: string[] = [];
  const today = startOfDay(new Date());
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

/** Extracts the first integer found in a rep string like "12" or "8/side". */
export function firstNumber(input: string | null | undefined): number | null {
  if (!input) return null;
  const match = input.match(/\d+/);
  return match ? Number(match[0]) : null;
}
