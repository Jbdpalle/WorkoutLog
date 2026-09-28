"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Exercise, WorkoutLog } from "@prisma/client";

type WorkoutWithExercises = WorkoutLog & { exercises: Exercise[] };

export function WorkoutDetail({ workout }: { workout: WorkoutWithExercises }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [actuals, setActuals] = useState<Record<string, string>>(
    Object.fromEntries(workout.exercises.map((e) => [e.id, e.actualReps ?? ""]))
  );
  const [notes, setNotes] = useState(workout.notes ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          exercises: workout.exercises.map((e) => ({ id: e.id, actualReps: actuals[e.id] || null })),
        }),
      });
      setEditing(false);
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

  const date = new Date(workout.date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Workout {workout.workoutType} {workout.phaseLabel ? `— ${workout.phaseLabel}` : ""}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {date}
            {workout.programDay ? ` · Program day ${workout.programDay}` : ""}
            {workout.durationMin ? ` · ${workout.durationMin} min` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <button className="btn-primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          ) : (
            <button className="btn-secondary" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          <button className="btn-secondary text-red-500" onClick={remove} disabled={busy}>
            Delete
          </button>
        </div>
      </div>

      <div className="card flex flex-col gap-3">
        {workout.exercises.map((ex) => (
          <div key={ex.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium">{ex.name}</p>
              <p className="text-xs text-slate-500">target: {ex.targetReps || "—"}</p>
            </div>
            {editing ? (
              <input
                className="input w-32"
                value={actuals[ex.id] ?? ""}
                onChange={(e) => setActuals((prev) => ({ ...prev, [ex.id]: e.target.value }))}
              />
            ) : (
              <span className="text-sm font-semibold">{ex.actualReps || "—"}</span>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <p className="label">Notes</p>
        {editing ? (
          <textarea
            className="input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        ) : (
          <p className="text-sm">{workout.notes || "—"}</p>
        )}
      </div>
    </div>
  );
}
