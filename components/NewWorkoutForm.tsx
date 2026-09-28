"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseTemplate, WorkoutType } from "@/lib/program";

interface Props {
  templates: Record<WorkoutType, ExerciseTemplate[]>;
  defaultType: WorkoutType;
  phaseLabel: string;
  programDay: number;
  rounds: string;
}

const TYPE_LABELS: Record<WorkoutType, string> = {
  A: "A — Strength",
  B: "B — Athletic",
  MIN: "Minimum Day",
};

export function NewWorkoutForm({ templates, defaultType, phaseLabel, programDay, rounds }: Props) {
  const router = useRouter();
  const [type, setType] = useState<WorkoutType>(defaultType);
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exercises = templates[type];

  async function submit() {
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
          rounds: 2,
          durationMin: durationMin ? Number(durationMin) : null,
          notes: notes || null,
          exercises: exercises.map((e) => ({
            name: e.name,
            targetReps: e.targetReps,
            actualReps: actuals[e.name] || null,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to save workout");
      const saved = await res.json();
      router.push(`/workout/${saved.id}`);
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
          {type === "MIN" ? "Minimum Day — 1 round, ~10 min" : `${phaseLabel} · ${rounds}`}
        </p>
      </div>

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

      <div className="card flex flex-col gap-3">
        {exercises.map((ex) => (
          <div key={ex.name} className="flex items-center gap-3">
            <div className="w-40 shrink-0">
              <p className="text-sm font-medium">{ex.name}</p>
              <p className="text-xs text-slate-500">target: {ex.targetReps || "—"}</p>
            </div>
            <input
              className="input"
              placeholder={`e.g. ${ex.targetReps || "done"}`}
              value={actuals[ex.name] ?? ""}
              onChange={(e) => setActuals((prev) => ({ ...prev, [ex.name]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className="card flex flex-col gap-3">
        <div>
          <label className="label">Duration (min, optional)</label>
          <input
            type="number"
            className="input"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Anything to remember next time?"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button className="btn-primary" onClick={submit} disabled={saving}>
        {saving ? "Saving…" : "Save workout"}
      </button>
    </div>
  );
}
