import { prisma } from "@/lib/prisma";
import { HistoryClient } from "@/components/HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [workouts, waterLogs, sleepLogs] = await Promise.all([
    prisma.workoutLog.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: { exercises: { orderBy: [{ round: "asc" }, { order: "asc" }] } },
    }),
    prisma.waterLog.findMany({ orderBy: { date: "desc" }, take: 200 }),
    prisma.sleepLog.findMany({ orderBy: { date: "desc" }, take: 200 }),
  ]);

  return <HistoryClient workouts={workouts} waterLogs={waterLogs} sleepLogs={sleepLogs} />;
}
