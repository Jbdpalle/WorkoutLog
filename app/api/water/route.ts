import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.waterLog.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const amountMl = Number(body.amountMl);
  if (!Number.isFinite(amountMl) || amountMl <= 0) {
    return NextResponse.json({ error: "amountMl must be a positive number" }, { status: 400 });
  }
  const log = await prisma.waterLog.create({
    data: {
      amountMl,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });
  return NextResponse.json(log, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  await prisma.waterLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const log = await prisma.waterLog.update({
    where: { id: body.id },
    data: {
      ...(body.amountMl !== undefined ? { amountMl: Number(body.amountMl) } : {}),
      ...(body.date !== undefined ? { date: new Date(body.date) } : {}),
    },
  });
  return NextResponse.json(log);
}
