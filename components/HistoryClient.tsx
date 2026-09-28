"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Exercise, SleepLog, WaterLog, WorkoutLog } from "@prisma/client";

type WorkoutWithExercises = WorkoutLog & { exercises: Exercise[] };
type Tab = "workouts" | "water" | "sleep";

interface Props {
  workouts: WorkoutWithExercises[];
  waterLogs: WaterLog[];
  sleepLogs: SleepLog[];
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HistoryClient({ workouts, waterLogs, sleepLogs }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("workouts");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function deleteWater(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/water?id=${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteSleep(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/sleep?id=${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">History</h1>

      <div className="flex gap-2">
        {(["workouts", "water", "sleep"] as Tab[]).map((t) => (
          <button
            key={t}
            className={tab === t ? "btn-primary capitalize" : "btn-secondary capitalize"}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "workouts" && (
        <div className="flex flex-col gap-2">
          {workouts.length === 0 && <p className="text-sm text-slate-400">No workouts logged yet.</p>}
          {workouts.map((w) => (
            <Link
              key={w.id}
              href={`/workout/${w.id}`}
              className="card flex items-center justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div>
                <p className="text-sm font-medium">
                  Workout {w.workoutType} {w.phaseLabel ? `— ${w.phaseLabel}` : ""}
                </p>
                <p className="text-xs text-slate-500">
                  {fmtDate(w.date)} · {w.exercises.length} exercises
                  {w.programDay ? ` · Day ${w.programDay}` : ""}
                </p>
              </div>
              <span className="text-slate-400">→</span>
            </Link>
          ))}
        </div>
      )}

      {tab === "water" && (
        <div className="flex flex-col gap-2">
          {waterLogs.length === 0 && <p className="text-sm text-slate-400">No water logged yet.</p>}
          {waterLogs.map((w) => (
            <div key={w.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{w.amountMl} ml</p>
                <p className="text-xs text-slate-500">{fmtDate(w.date)}</p>
              </div>
              <button
                className="btn-secondary text-red-500"
                disabled={busyId === w.id}
                onClick={() => deleteWater(w.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "sleep" && (
        <div className="flex flex-col gap-2">
          {sleepLogs.length === 0 && <p className="text-sm text-slate-400">No sleep logged yet.</p>}
          {sleepLogs.map((s) => (
            <div key={s.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{s.hours} hrs</p>
                <p className="text-xs text-slate-500">{fmtDate(s.date)}</p>
              </div>
              <button
                className="btn-secondary text-red-500"
                disabled={busyId === s.id}
                onClick={() => deleteSleep(s.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
