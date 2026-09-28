"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Exercise, WorkoutLog } from "@prisma/client";
import type { ExerciseTemplate } from "@/lib/program";
import { dayKey } from "@/lib/dates";

type WorkoutWithExercises = WorkoutLog & { exercises: Exercise[] };

interface Props {
  workout: WorkoutWithExercises;
  template: ExerciseTemplate[];
}

function buildRoundState(workout: WorkoutWithExercises, template: ExerciseTemplate[]) {
  const values: Record<number, Record<string, string>> = {};
  const saved: Record<number, boolean> = {};
  for (let r = 1; r <= Math.max(workout.rounds, 1); r++) {
    const existing = workout.exercises.filter((e) => e.round === r);
    if (existing.length > 0) {
      values[r] = Object.fromEntries(existing.map((e) => [e.name, e.actualReps ?? ""]));
      saved[r] = true;
    } else {
      values[r] = Object.fromEntries(template.map((t) => [t.name, ""]));
      saved[r] = false;
    }
  }
  return { values, saved };
}

export function WorkoutDetail({ workout, template }: Props) {
  const router = useRouter();
  const initial = buildRoundState(workout, template);
  const [roundValues, setRoundValues] = useState(initial.values);
  const [roundSaved, setRoundSaved] = useState(initial.saved);
  const [savingRound, setSavingRound] = useState<number | null>(null);

  const [date, setDate] = useState(dayKey(workout.date));
  const [notes, setNotes] = useState(workout.notes ?? "");
  const [durationMin, setDurationMin] = useState(workout.durationMin?.toString() ?? "");
  const [busy, setBusy] = useState(false);

  async function saveRound(round: number) {
    setSavingRound(round);
    try {
      await fetch(`/api/workouts/${workout.id}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round,
          exercises: template.map((t) => ({
            name: t.name,
            targetReps: t.targetReps,
            actualReps: roundValues[round][t.name] || null,
          })),
        }),
      });
      setRoundSaved((prev) => ({ ...prev, [round]: true }));
      router.refresh();
    } finally {
      setSavingRound(null);
    }
  }

  async function saveDetails() {
    setBusy(true);
    try {
      await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          notes,
          durationMin: durationMin ? Number(durationMin) : null,
        }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this workout log? This can't be undone.")) return;
    setBusy(true);
    try {
      await fetch(`/api/workouts/${workout.id}`, { method: "DELETE" });
      router.push("/history");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const rounds = Array.from({ length: Math.max(workout.rounds, 1) }, (_, i) => i + 1);
  const completedCount = rounds.filter((r) => roundSaved[r]).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            Workout {workout.workoutType} {workout.phaseLabel ? `— ${workout.phaseLabel}` : ""}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {completedCount}/{rounds.length} round{rounds.length === 1 ? "" : "s"} logged
          </p>
        </div>
        <button className="btn-secondary text-red-500" onClick={remove} disabled={busy}>
          Delete
        </button>
      </div>

      <div className="card grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onBlur={saveDetails}
          />
        </div>
        <div>
          <label className="label">Duration (min, optional)</label>
          <input
            type="number"
            className="input"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            onBlur={saveDetails}
          />
        </div>
      </div>

      {rounds.map((r) => (
        <div key={r} className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">
              Round {r} of {rounds.length}
            </p>
            {roundSaved[r] && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Saved</span>
            )}
          </div>
          {template.map((t) => (
            <div key={t.name} className="flex items-center gap-3">
              <div className="w-40 shrink-0">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-slate-500">target: {t.targetReps || "—"}</p>
              </div>
              <input
                className="input"
                placeholder={`e.g. ${t.targetReps || "done"}`}
                value={roundValues[r][t.name] ?? ""}
                onChange={(e) =>
                  setRoundValues((prev) => ({
                    ...prev,
                    [r]: { ...prev[r], [t.name]: e.target.value },
                  }))
                }
              />
            </div>
          ))}
          <button
            className="btn-primary self-start"
            onClick={() => saveRound(r)}
            disabled={savingRound === r}
          >
            {savingRound === r ? "Saving…" : roundSaved[r] ? `Update round ${r}` : `Save round ${r}`}
          </button>
        </div>
      ))}

      <div className="card">
        <p className="label">Notes</p>
        <textarea
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveDetails}
          placeholder="How did it feel? Anything to remember next time?"
        />
      </div>
    </div>
  );
}
