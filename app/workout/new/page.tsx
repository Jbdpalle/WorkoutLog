import { prisma } from "@/lib/prisma";
import { getProgramDay, getWorkoutTemplate, type WorkoutType } from "@/lib/program";
import { NewWorkoutForm } from "@/components/NewWorkoutForm";

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

  const defaultType: WorkoutType =
    sp.type === "A" || sp.type === "B" || sp.type === "MIN" ? (sp.type as WorkoutType) : "A";

  const templates: Record<WorkoutType, ReturnType<typeof getWorkoutTemplate>> = {
    A: getWorkoutTemplate("A", programInfo.phase),
    B: getWorkoutTemplate("B", programInfo.phase),
    MIN: getWorkoutTemplate("MIN", programInfo.phase),
  };

  return (
    <NewWorkoutForm
      templates={templates}
      defaultType={defaultType}
      phaseLabel={programInfo.phase.label}
      programDay={programInfo.dayInCycle}
      rounds={programInfo.phase.rounds}
    />
  );
}
