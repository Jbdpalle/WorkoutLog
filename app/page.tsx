import { prisma } from "@/lib/prisma";
import { getProgramDay, suggestNextWorkoutType } from "@/lib/program";
import { DashboardClient } from "@/components/DashboardClient";

async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: 1 } });
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function DashboardPage() {
  const settings = await getSettings();

  const since = new Date();
  since.setDate(since.getDate() - 13); // 14-day window including today
  const sinceStart = startOfDay(since);

  const [waterLogs, sleepLogs, recentWorkouts] = await Promise.all([
    prisma.waterLog.findMany({
      where: { date: { gte: sinceStart } },
      orderBy: { date: "asc" },
    }),
    prisma.sleepLog.findMany({
      where: { date: { gte: sinceStart } },
      orderBy: { date: "asc" },
    }),
    prisma.workoutLog.findMany({
      orderBy: { date: "desc" },
      take: 10,
      include: { exercises: { orderBy: { order: "asc" } } },
    }),
  ]);

  const today = startOfDay(new Date());
  const todayWaterMl = waterLogs
    .filter((w) => startOfDay(w.date).getTime() === today.getTime())
    .reduce((sum, w) => sum + w.amountMl, 0);

  const todaySleep = sleepLogs.find(
    (s) => startOfDay(s.date).getTime() === today.getTime()
  );

  const programInfo = getProgramDay(settings.programStartDate, new Date());
  const lastWorkoutType = recentWorkouts[0]?.workoutType ?? null;
  const suggestedType = suggestNextWorkoutType(lastWorkoutType);

  return (
    <DashboardClient
      settings={settings}
      waterLogs={waterLogs}
      sleepLogs={sleepLogs}
      recentWorkouts={recentWorkouts}
      todayWaterMl={todayWaterMl}
      todaySleep={todaySleep ?? null}
      programInfo={programInfo}
      suggestedType={suggestedType}
    />
  );
}
