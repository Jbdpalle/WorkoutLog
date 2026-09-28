import { prisma } from "@/lib/prisma";
import { getProgramDay, getWeeklyPlan, type WorkoutType } from "@/lib/program";
import { NewWorkoutForm } from "@/components/NewWorkoutForm";

export const dynamic = "force-dynamic";

async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: 1 } });
}

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const settings = await getSettings();
  const programInfo = getProgramDay(settings.programStartDate, new Date());
  const weeklyPlan = getWeeklyPlan(settings.programStartDate, new Date());

  const queryType =
    sp.type === "A" || sp.type === "B" || sp.type === "MIN" ? (sp.type as WorkoutType) : null;
  const planType = weeklyPlan.type === "A" || weeklyPlan.type === "B" ? weeklyPlan.type : null;
  // Minimum Day is for when you're too tired/busy to do a *scheduled* A/B
  // session — not the default for a rest/mobility day, which just has no
  // scheduled session at all. So the fallback here is a full workout (A),
  // not Minimum Day; MIN stays a click away if that's what you actually want.
  const defaultType: WorkoutType = queryType ?? planType ?? "A";
  const defaultRounds = defaultType === "MIN" ? 1 : programInfo.phase.roundsDefault;

  return (
    <NewWorkoutForm
      defaultType={defaultType}
      defaultRounds={defaultRounds}
      phaseRoundsDefault={programInfo.phase.roundsDefault}
      phaseLabel={programInfo.phase.label}
      programDay={programInfo.dayInCycle}
      weeklyPlan={weeklyPlan}
    />
  );
}
