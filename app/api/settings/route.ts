import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getOrCreateSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: 1 } });
}

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  await getOrCreateSettings();
  const settings = await prisma.settings.update({
    where: { id: 1 },
    data: {
      ...(body.waterGoalMl !== undefined ? { waterGoalMl: Number(body.waterGoalMl) } : {}),
      ...(body.sleepGoalHrs !== undefined ? { sleepGoalHrs: Number(body.sleepGoalHrs) } : {}),
      ...(body.programStartDate !== undefined
        ? { programStartDate: body.programStartDate ? new Date(body.programStartDate) : null }
        : {}),
    },
  });
  return NextResponse.json(settings);
}
