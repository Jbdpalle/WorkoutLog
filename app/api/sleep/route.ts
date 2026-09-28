import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.sleepLog.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const hours = Number(body.hours);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
    return NextResponse.json({ error: "hours must be between 0 and 24" }, { status: 400 });
  }
  const log = await prisma.sleepLog.create({
    data: {
      hours,
      quality: body.quality !== undefined && body.quality !== null ? Number(body.quality) : null,
      notes: body.notes ?? null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });
  return NextResponse.json(log, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  await prisma.sleepLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const log = await prisma.sleepLog.update({
    where: { id: body.id },
    data: {
      ...(body.hours !== undefined ? { hours: Number(body.hours) } : {}),
      ...(body.quality !== undefined ? { quality: body.quality === null ? null : Number(body.quality) } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.date !== undefined ? { date: new Date(body.date) } : {}),
    },
  });
  return NextResponse.json(log);
}
