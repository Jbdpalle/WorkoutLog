/**
 * "The Progressive Full-Body System" — transcribed directly from the user's
 * program notes. Where the notes gave two different lengths for the cycle
 * (the day-by-day walkthrough describes a deload at Days 61-70 with an exact
 * rep table, while the later "Long-Term 10-Day Progression" summary table
 * instead shows Days 61-70 as a further progression step and puts the
 * second deload at Days 71-80 with no numbers given), this file follows the
 * day-by-day walkthrough, since it is the one with concrete, stated numbers.
 * That makes the repeating cycle 70 days, not 80. See README.md for the
 * detail — worth double-checking against your own notes.
 */

export type ExerciseKey =
  | "rope"
  | "burpees"
  | "pushups"
  | "squat"
  | "row"
  | "swings"
  | "lunges"
  | "deadbug";

export interface Phase {
  id: string;
  label: string;
  dayStart: number;
  dayEnd: number;
  rounds: string;
  /** Sensible default for the "how many rounds" picker on the log-workout form — always editable. */
  roundsDefault: number;
  tempo?: string;
  targets?: Record<ExerciseKey, string>;
  guidance?: string;
}

export const CYCLE_LENGTH_DAYS = 70;

export const PHASES: Phase[] = [
  {
    id: "phase1",
    label: "Phase 1 — Learn the movements",
    dayStart: 1,
    dayEnd: 10,
    rounds: "2 rounds",
    roundsDefault: 2,
    targets: {
      rope: "60 sec",
      burpees: "5",
      pushups: "8",
      squat: "8",
      row: "8/side",
      swings: "10",
      lunges: "6/leg",
      deadbug: "8/side",
    },
  },
  {
    id: "phase2",
    label: "Phase 2",
    dayStart: 11,
    dayEnd: 20,
    rounds: "2 rounds",
    roundsDefault: 2,
    targets: {
      rope: "75 sec",
      burpees: "7",
      pushups: "10",
      squat: "10",
      row: "10/side",
      swings: "12",
      lunges: "8/leg",
      deadbug: "10/side",
    },
  },
  {
    id: "phase3",
    label: "Phase 3",
    dayStart: 21,
    dayEnd: 30,
    rounds: "2 rounds",
    roundsDefault: 2,
    targets: {
      rope: "90 sec",
      burpees: "9",
      pushups: "12",
      squat: "12",
      row: "12/side",
      swings: "15",
      lunges: "10/leg",
      deadbug: "12/side",
    },
  },
  {
    id: "deload1",
    label: "Deload",
    dayStart: 31,
    dayEnd: 40,
    rounds: "1–2 rounds (by feel)",
    roundsDefault: 2,
    guidance:
      "Drop volume ~25–35%. Use this period to improve mobility, technique, sleep, recovery, movement quality. Finish hungry to train, not exhausted.",
    targets: {
      rope: "60 sec",
      burpees: "5–6",
      pushups: "8",
      squat: "8",
      row: "8/side",
      swings: "10",
      lunges: "6/leg",
      deadbug: "8/side",
    },
  },
  {
    id: "phase4",
    label: "Phase 4 — introduce tempo",
    dayStart: 41,
    dayEnd: 50,
    rounds: "2 rounds",
    roundsDefault: 2,
    tempo:
      "Push-ups & goblet squats: 3 sec down → 1 sec pause → up. Reverse lunge: 2–3 sec down → drive up.",
    targets: {
      rope: "90 sec",
      burpees: "8",
      pushups: "12",
      squat: "12",
      row: "12/side",
      swings: "15",
      lunges: "10/leg",
      deadbug: "12/side",
    },
  },
  {
    id: "phase5",
    label: "Phase 5",
    dayStart: 51,
    dayEnd: 60,
    rounds: "2 rounds",
    roundsDefault: 2,
    targets: {
      rope: "2 min",
      burpees: "10",
      pushups: "14",
      squat: "14",
      row: "14/side",
      swings: "18",
      lunges: "12/leg",
      deadbug: "14/side",
    },
  },
  {
    id: "deload2",
    label: "Deload",
    dayStart: 61,
    dayEnd: 70,
    rounds: "1–2 rounds (by feel)",
    roundsDefault: 2,
    guidance:
      "Reduce volume ~30–40%. Don't stop moving — rope, mobility, easy bodyweight, light kettlebell work, technique. No exact numbers given in your notes for this block; use judgement and the Phase 5 numbers as a ceiling.",
  },
];

export const MINIMUM_DAY: { name: string; target: string }[] = [
  { name: "Skip rope", target: "30–60 sec" },
  { name: "Burpees", target: "5" },
  { name: "Push-ups", target: "8" },
  { name: "KB Goblet Squat", target: "8" },
  { name: "KB Row", target: "8/side" },
  { name: "KB Swings", target: "10" },
  { name: "Reverse Lunges", target: "6/leg" },
  { name: "Plank", target: "20 sec" },
];

export function getPhaseForDay(dayInCycle: number): Phase {
  return (
    PHASES.find((p) => dayInCycle >= p.dayStart && dayInCycle <= p.dayEnd) ??
    PHASES[0]
  );
}

export function getProgramDay(
  programStartDate: Date | string | null,
  referenceDate: Date = new Date()
): { elapsedDays: number; dayInCycle: number; cycleNumber: number; phase: Phase } {
  if (!programStartDate) {
    return { elapsedDays: 0, dayInCycle: 1, cycleNumber: 1, phase: PHASES[0] };
  }
  const start = new Date(programStartDate);
  start.setHours(0, 0, 0, 0);
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  const elapsedDays = Math.max(
    0,
    Math.round((ref.getTime() - start.getTime()) / 86_400_000)
  );
  const dayInCycle = (elapsedDays % CYCLE_LENGTH_DAYS) + 1;
  const cycleNumber = Math.floor(elapsedDays / CYCLE_LENGTH_DAYS) + 1;
  return { elapsedDays, dayInCycle, cycleNumber, phase: getPhaseForDay(dayInCycle) };
}

export type WorkoutType = "A" | "B" | "MIN";

export interface ExerciseTemplate {
  name: string;
  targetReps: string;
}

export function getWorkoutTemplate(
  type: WorkoutType,
  phase: Phase
): ExerciseTemplate[] {
  const t = phase.targets;
  const fallback = (key: ExerciseKey, name: string): ExerciseTemplate => ({
    name,
    targetReps: t ? t[key] : phase.guidance ? "by feel — see phase notes" : "",
  });

  if (type === "MIN") {
    return MINIMUM_DAY.map((e) => ({ name: e.name, targetReps: e.target }));
  }

  if (type === "A") {
    return [
      fallback("rope", "Skip rope"),
      fallback("burpees", "Burpees"),
      fallback("pushups", "Push-ups"),
      fallback("squat", "KB Goblet Squat"),
      fallback("row", "KB Row"),
      fallback("swings", "KB Swings"),
      fallback("lunges", "Reverse Lunges"),
      fallback("deadbug", "Dead Bug"),
    ];
  }

  // Workout B — Athletic
  return [
    fallback("rope", "Skip rope"),
    fallback("burpees", "Burpees"),
    fallback("pushups", "Push-ups"),
    { name: "KB Romanian Deadlift", targetReps: "10–15" },
    fallback("row", "KB Row"),
    { name: "KB Reverse Lunges", targetReps: "8–12/leg" },
    { name: "Mountain Climbers", targetReps: "20–30 total" },
    { name: "Plank", targetReps: "20–40 sec" },
  ];
}

/**
 * "The Three Workout Days" / "Your Weekly Rotation" from your notes:
 *   Week 1 — Mon A, Tue rest, Wed B, Thu rest, Fri A, Sat mobility, Sun rest
 *   Week 2 — Mon B, Tue rest, Wed A, Thu rest, Fri B, Sat mobility, Sun rest
 * then repeat, alternating every week. Independent of the 70-day phase
 * cycle above — this is just which of A/B/rest/mobility today is.
 */
export type DayPlanType = "A" | "B" | "REST" | "MOBILITY";

export interface DayPlan {
  weekday: string;
  type: DayPlanType;
}

const WEEK_A: DayPlanType[] = ["A", "REST", "B", "REST", "A", "MOBILITY", "REST"]; // Mon..Sun
const WEEK_B: DayPlanType[] = ["B", "REST", "A", "REST", "B", "MOBILITY", "REST"]; // Mon..Sun

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function mondayOf(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const isoWeekday = x.getDay() === 0 ? 7 : x.getDay(); // Mon=1..Sun=7
  x.setDate(x.getDate() - (isoWeekday - 1));
  return x;
}

/**
 * Today's plan. Week parity is measured in calendar weeks (Mon-Sun) elapsed
 * since the Monday of the week the program started in — so "Week 1" is
 * always the week you started, matching the notes' own Week 1 / Week 2
 * example, regardless of which weekday you happened to start on.
 */
export function getWeeklyPlan(
  programStartDate: Date | string | null,
  referenceDate: Date = new Date()
): DayPlan {
  const ref = new Date(referenceDate);
  const isoWeekday = ref.getDay() === 0 ? 7 : ref.getDay(); // Mon=1..Sun=7
  const weekday = WEEKDAY_NAMES[isoWeekday - 1];

  if (!programStartDate) {
    return { weekday, type: WEEK_A[isoWeekday - 1] };
  }

  const startMonday = mondayOf(new Date(programStartDate));
  const refMonday = mondayOf(ref);
  const weeksElapsed = Math.round(
    (refMonday.getTime() - startMonday.getTime()) / (7 * 86_400_000)
  );
  const pattern = Math.abs(weeksElapsed) % 2 === 0 ? WEEK_A : WEEK_B;
  return { weekday, type: pattern[isoWeekday - 1] };
}
