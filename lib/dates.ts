export function startOfDay(d: Date | string): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dayKey(d: Date | string): string {
  return startOfDay(d).toISOString().slice(0, 10);
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
