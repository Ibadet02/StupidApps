import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAppBySlug, getAllApps } from "@/lib/apps";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const appSlug = formData.get("appSlug") as string | null;
  const isBundle = formData.get("bundle") === "true";

  const baseUrl = req.nextUrl.origin;

  try {
    if (isBundle) {
      const apps = await getAllApps();
      const totalValue = apps.reduce((sum, app) => sum + app.price, 0);
      const bundlePrice = Math.round(totalValue * 0.6);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "StupidApps Bundle",
                description: `All ${apps.length} apps in the StupidApps collection`,
              },
              unit_amount: bundlePrice,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/bundle`,
        metadata: {
          type: "bundle",
        },
      });

      return NextResponse.redirect(session.url!, 303);
    }

    if (!appSlug) {
      return NextResponse.json({ error: "Missing app slug" }, { status: 400 });
    }

    const app = await getAppBySlug(appSlug);
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: app.name,
              description: app.tagline,
            },
            unit_amount: app.price,
          },
          unit_amount_decimal: undefined,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/apps/${appSlug}`,
      metadata: {
        type: "single",
        appSlug: appSlug,
      },
    });

    return NextResponse.redirect(session.url!, 303);
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
