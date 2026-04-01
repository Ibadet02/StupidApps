import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { key, appSlug } = await req.json();

  if (!key || !appSlug) {
    return NextResponse.json({ error: "Missing key or appSlug" }, { status: 400 });
  }

  const license = await prisma.license.findUnique({
    where: { key },
  });

  if (!license || license.appSlug !== appSlug) {
    return NextResponse.json({ error: "Invalid license key" }, { status: 404 });
  }

  return NextResponse.json({ valid: true });
}
