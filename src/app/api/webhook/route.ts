import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function generateLicenseKey(): string {
  return `SA-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details?.email || "unknown";
      const appSlug = session.metadata?.appSlug || null;
      const isBundle = session.metadata?.type === "bundle";

      await prisma.purchase.create({
        data: {
          email,
          stripeSessionId: session.id,
          appSlug,
          isBundle,
        },
      });

      // Generate license key(s) for purchased app(s)
      if (isBundle) {
        const apps = await prisma.app.findMany();
        for (const app of apps) {
          await prisma.license.create({
            data: {
              key: generateLicenseKey(),
              email,
              appSlug: app.slug,
            },
          });
        }
      } else if (appSlug) {
        await prisma.license.create({
          data: {
            key: generateLicenseKey(),
            email,
            appSlug,
          },
        });
      }

      console.log(`Purchase + license recorded: ${isBundle ? "bundle" : appSlug} - ${email}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
