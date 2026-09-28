"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Settings, WaterLog, SleepLog, WorkoutLog, Exercise } from "@prisma/client";
import type { DayPlan } from "@/lib/program";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dayKey, firstNumber, lastNDayKeys, shortLabel } from "@/lib/dates";

type WorkoutWithExercises = WorkoutLog & { exercises: Exercise[] };

interface Props {
  settings: Settings;
  waterLogs: WaterLog[];
  sleepLogs: SleepLog[];
  recentWorkouts: WorkoutWithExercises[];
  todayWaterMl: number;
  todaySleep: SleepLog | null;
  programInfo: { elapsedDays: number; dayInCycle: number; cycleNumber: number; phase: { label: string; guidance?: string } };
  weeklyPlan: DayPlan;
}

const PLAN_COPY: Record<DayPlan["type"], string> = {
  A: "Workout A",
  B: "Workout B",
  REST: "Rest day",
  MOBILITY: "Mobility day",
};

export function DashboardClient({
  settings,
  waterLogs,
  sleepLogs,
  recentWorkouts,
  todayWaterMl,
  todaySleep,
  programInfo,
  weeklyPlan,
}: Props) {
  const router = useRouter();
  const [waterGoal, setWaterGoal] = useState(settings.waterGoalMl);
  const [sleepGoal, setSleepGoal] = useState(settings.sleepGoalHrs);
  const [busy, setBusy] = useState(false);
  const [sleepInput, setSleepInput] = useState(todaySleep ? String(todaySleep.hours) : "");

  const waterChartData = useMemo(() => {
    const keys = lastNDayKeys(14);
    const totals = new Map<string, number>();
    for (const log of waterLogs) {
      const k = dayKey(log.date);
      totals.set(k, (totals.get(k) ?? 0) + log.amountMl);
    }
    return keys.map((k) => ({ day: shortLabel(k), ml: totals.get(k) ?? 0 }));
  }, [waterLogs]);

  const sleepChartData = useMemo(() => {
    const keys = lastNDayKeys(14);
    const byDay = new Map<string, number>();
    for (const log of sleepLogs) {
      byDay.set(dayKey(log.date), log.hours);
    }
    return keys.map((k) => ({ day: shortLabel(k), hours: byDay.get(k) ?? 0 }));
  }, [sleepLogs]);

  const pushupTrend = useMemo(() => {
    return [...recentWorkouts]
      .reverse()
      .map((w) => {
        // Round 1's Push-ups as the representative value for the trend line.
        const pushups = w.exercises.find((e) => e.name === "Push-ups" && e.round === 1);
        const reps = firstNumber(pushups?.actualReps) ?? firstNumber(pushups?.targetReps);
        return {
          day: shortLabel(dayKey(w.date)),
          reps: reps ?? 0,
        };
      })
      .filter((d) => d.reps > 0);
  }, [recentWorkouts]);

  async function addWater(amountMl: number) {
    setBusy(true);
    try {
      await fetch("/api/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveWaterGoal() {
    setBusy(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waterGoalMl: waterGoal }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveSleep() {
    const hours = Number(sleepInput);
    if (!Number.isFinite(hours) || hours < 0) return;
    setBusy(true);
    try {
      if (todaySleep) {
        await fetch("/api/sleep", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: todaySleep.id, hours }),
        });
      } else {
        await fetch("/api/sleep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hours }),
        });
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveSleepGoal() {
    setBusy(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sleepGoalHrs: sleepGoal }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function startProgramToday() {
    setBusy(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programStartDate: new Date().toISOString() }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const waterPct = Math.min(100, Math.round((todayWaterMl / Math.max(1, waterGoal)) * 100));

  return (
    <div className="flex flex-col gap-6">
      {/* Program banner */}
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label">Program</p>
          <p className="text-lg font-semibold">
            {settings.programStartDate ? (
              <>
                Day {programInfo.dayInCycle} of 70 — {programInfo.phase.label}
                {programInfo.cycleNumber > 1 ? ` (cycle ${programInfo.cycleNumber})` : ""}
              </>
            ) : (
              "Program not started"
            )}
          </p>
          {programInfo.phase.guidance && (
            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
              {programInfo.phase.guidance}
            </p>
          )}
          {settings.programStartDate && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Today ({weeklyPlan.weekday}) — <span className="font-medium">{PLAN_COPY[weeklyPlan.type]}</span>
            </p>
          )}
        </div>
        {settings.programStartDate ? (
          <Link
            href={weeklyPlan.type === "A" || weeklyPlan.type === "B" ? `/workout/new?type=${weeklyPlan.type}` : "/workout/new"}
            className="btn-primary"
          >
            {weeklyPlan.type === "A" || weeklyPlan.type === "B"
              ? `Log ${PLAN_COPY[weeklyPlan.type]} →`
              : "Log a workout anyway →"}
          </Link>
        ) : (
          <button className="btn-primary" onClick={startProgramToday} disabled={busy}>
            Start program today
          </button>
        )}
      </div>

      {/* Water + Sleep cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="label">💧 Water today</p>
            <span className="text-xs text-slate-500">{waterPct}% of goal</span>
          </div>
          <p className="text-2xl font-bold text-water">{todayWaterMl} ml</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-water transition-all"
              style={{ width: `${waterPct}%` }}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-secondary" disabled={busy} onClick={() => addWater(250)}>
              +250 ml
            </button>
            <button className="btn-secondary" disabled={busy} onClick={() => addWater(500)}>
              +500 ml
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <label className="text-slate-500">Daily goal (ml)</label>
            <input
              type="number"
              className="input w-24 py-1"
              value={waterGoal}
              onChange={(e) => setWaterGoal(Number(e.target.value))}
              onBlur={saveWaterGoal}
            />
          </div>
        </div>

        <div className="card">
          <p className="label">😴 Sleep last night</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.25"
              className="input w-24"
              placeholder="hours"
              value={sleepInput}
              onChange={(e) => setSleepInput(e.target.value)}
            />
            <button className="btn-primary" disabled={busy} onClick={saveSleep}>
              Save
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <label className="text-slate-500">Goal (hrs)</label>
            <input
              type="number"
              step="0.5"
              className="input w-20 py-1"
              value={sleepGoal}
              onChange={(e) => setSleepGoal(Number(e.target.value))}
              onBlur={saveSleepGoal}
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="label mb-2">Water — last 14 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={waterChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <ReferenceLine y={waterGoal} stroke="#3b82f6" strokeDasharray="4 4" />
              <Bar dataKey="ml" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="label mb-2">Sleep — last 14 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sleepChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={30} />
              <Tooltip />
              <ReferenceLine y={sleepGoal} stroke="#8b5cf6" strokeDasharray="4 4" />
              <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card sm:col-span-2">
          <p className="label mb-2">Push-up trend — last {pushupTrend.length || 0} workouts</p>
          {pushupTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={pushupTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <Tooltip />
                <Line type="monotone" dataKey="reps" stroke="#f97316" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">
              Log a couple of workouts to see your push-up trend here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
