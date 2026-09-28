"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DayPlan, WorkoutType } from "@/lib/program";
import { dayKey } from "@/lib/dates";

interface Props {
  defaultType: WorkoutType;
  defaultRounds: number;
  phaseLabel: string;
  programDay: number;
  weeklyPlan: DayPlan;
}

const TYPE_LABELS: Record<WorkoutType, string> = {
  A: "A — Strength",
  B: "B — Athletic",
  MIN: "Minimum Day",
};

const PLAN_COPY: Record<DayPlan["type"], string> = {
  A: "Workout A",
  B: "Workout B",
  REST: "a rest day",
  MOBILITY: "a mobility day",
};

export function NewWorkoutForm({ defaultType, defaultRounds, phaseLabel, programDay, weeklyPlan }: Props) {
  const router = useRouter();
  const [type, setType] = useState<WorkoutType>(defaultType);
  const [date, setDate] = useState(dayKey(new Date()));
  const [rounds, setRounds] = useState(defaultRounds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutType: type,
          phaseLabel: type === "MIN" ? "Minimum Day" : phaseLabel,
          programDay,
          rounds: type === "MIN" ? 1 : rounds,
          date,
        }),
      });
      if (!res.ok) throw new Error("Failed to start workout");
      const created = await res.json();
      router.push(`/workout/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Log a workout</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your weekly rotation says {weeklyPlan.weekday} is {PLAN_COPY[weeklyPlan.type]}.
        </p>
      </div>

      <div className="card flex flex-col gap-4">
        <div>
          <label className="label">Workout</label>
          <div className="flex gap-2">
            {(Object.keys(TYPE_LABELS) as WorkoutType[]).map((t) => (
              <button
                key={t}
                className={type === t ? "btn-primary" : "btn-secondary"}
                onClick={() => setType(t)}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {type === "MIN" ? "1 round, ~10 min" : `${phaseLabel} · target reps prefilled per round`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {type !== "MIN" && (
            <div>
              <label className="label">Rounds</label>
              <input
                type="number"
                min={1}
                max={5}
                className="input"
                value={rounds}
                onChange={(e) => setRounds(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button className="btn-primary" onClick={start} disabled={saving}>
        {saving ? "Starting…" : "Start workout"}
      </button>
    </div>
  );
}
