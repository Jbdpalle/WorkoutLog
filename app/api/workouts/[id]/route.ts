import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const workout = await prisma.workoutLog.findUnique({
    where: { id },
    include: { exercises: { orderBy: [{ round: "asc" }, { order: "asc" }] } },
  });
  if (!workout) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(workout);
}

/** Updates workout-level fields (date, notes, duration, planned round count). Round contents are saved via /rounds. */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json();

  const workout = await prisma.workoutLog.update({
    where: { id },
    data: {
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.durationMin !== undefined ? { durationMin: body.durationMin } : {}),
      ...(body.date !== undefined ? { date: new Date(body.date) } : {}),
      ...(body.rounds !== undefined ? { rounds: Number(body.rounds) } : {}),
    },
    include: { exercises: { orderBy: [{ round: "asc" }, { order: "asc" }] } },
  });
  return NextResponse.json(workout);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  await prisma.workoutLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
