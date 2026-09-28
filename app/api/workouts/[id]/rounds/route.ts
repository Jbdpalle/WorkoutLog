import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Saves (or re-saves) one round of a workout. Idempotent: replaces whatever
 * was stored for that round, so it doubles as the edit path for a round you
 * already logged.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const round = Number(body.round);
  const exercises = Array.isArray(body.exercises) ? body.exercises : [];

  if (!Number.isInteger(round) || round < 1) {
    return NextResponse.json({ error: "round must be a positive integer" }, { status: 400 });
  }

  const workout = await prisma.workoutLog.findUnique({ where: { id } });
  if (!workout) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.exercise.deleteMany({ where: { workoutId: id, round } }),
    prisma.exercise.createMany({
      data: exercises.map((e: any, i: number) => ({
        workoutId: id,
        round,
        name: e.name,
        targetReps: e.targetReps ?? null,
        actualReps: e.actualReps ?? null,
        order: i,
      })),
    }),
  ]);

  const updated = await prisma.workoutLog.findUnique({
    where: { id },
    include: { exercises: { orderBy: [{ round: "asc" }, { order: "asc" }] } },
  });
  return NextResponse.json(updated);
}
