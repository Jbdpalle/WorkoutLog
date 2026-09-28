import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const workout = await prisma.workoutLog.findUnique({
    where: { id },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  if (!workout) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(workout);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json();

  if (Array.isArray(body.exercises)) {
    await Promise.all(
      body.exercises.map((e: any) =>
        prisma.exercise.update({
          where: { id: e.id },
          data: {
            ...(e.actualReps !== undefined ? { actualReps: e.actualReps } : {}),
            ...(e.targetReps !== undefined ? { targetReps: e.targetReps } : {}),
          },
        })
      )
    );
  }

  const workout = await prisma.workoutLog.update({
    where: { id },
    data: {
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.durationMin !== undefined ? { durationMin: body.durationMin } : {}),
      ...(body.date !== undefined ? { date: new Date(body.date) } : {}),
      ...(body.rounds !== undefined ? { rounds: Number(body.rounds) } : {}),
    },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(workout);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  await prisma.workoutLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
