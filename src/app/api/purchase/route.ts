import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const purchase = await prisma.purchase.findUnique({
    where: { stripeSessionId: sessionId },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  // Get license keys for this purchase
  const licenses = await prisma.license.findMany({
    where: { email: purchase.email },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    email: purchase.email,
    isBundle: purchase.isBundle,
    appSlug: purchase.appSlug,
    licenses: licenses.map((l) => ({
      key: l.key,
      appSlug: l.appSlug,
    })),
  });
}
