import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkoutDetail } from "@/components/WorkoutDetail";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await prisma.workoutLog.findUnique({
    where: { id },
    include: { exercises: { orderBy: { order: "asc" } } },
  });

  if (!workout) notFound();

  return <WorkoutDetail workout={workout} />;
}
