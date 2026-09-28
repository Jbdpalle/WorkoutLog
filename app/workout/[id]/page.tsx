import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPhaseForDay, getWorkoutTemplate, type WorkoutType } from "@/lib/program";
import { WorkoutDetail } from "@/components/WorkoutDetail";

export const dynamic = "force-dynamic";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await prisma.workoutLog.findUnique({
    where: { id },
    include: { exercises: { orderBy: [{ round: "asc" }, { order: "asc" }] } },
  });

  if (!workout) notFound();

  const type = (["A", "B", "MIN"].includes(workout.workoutType) ? workout.workoutType : "A") as WorkoutType;
  const phase = getPhaseForDay(workout.programDay ?? 1);
  const template = getWorkoutTemplate(type, phase);

  return <WorkoutDetail workout={workout} template={template} />;
}
