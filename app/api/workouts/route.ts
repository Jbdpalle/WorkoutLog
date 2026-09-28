import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");
  const workouts = await prisma.workoutLog.findMany({
    orderBy: { date: "desc" },
    take: limit,
    include: { exercises: { orderBy: [{ round: "asc" }, { order: "asc" }] } },
  });
  return NextResponse.json(workouts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.workoutType) {
    return NextResponse.json({ error: "workoutType is required" }, { status: 400 });
  }
  const exercises = Array.isArray(body.exercises) ? body.exercises : [];

  const workout = await prisma.workoutLog.create({
    data: {
      date: body.date ? new Date(body.date) : new Date(),
      workoutType: body.workoutType,
      phaseLabel: body.phaseLabel ?? null,
      programDay: body.programDay ?? null,
      rounds: body.rounds ?? 2,
      durationMin: body.durationMin ?? null,
      notes: body.notes ?? null,
      exercises: {
        create: exercises.map((e: any, i: number) => ({
          name: e.name,
          targetReps: e.targetReps ?? null,
          actualReps: e.actualReps ?? null,
          order: i,
        })),
      },
    },
    include: { exercises: { orderBy: [{ round: "asc" }, { order: "asc" }] } },
  });
  return NextResponse.json(workout, { status: 201 });
}
