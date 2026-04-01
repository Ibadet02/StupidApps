import { getAllApps, formatPrice } from "@/lib/apps";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bundle Deal — StupidApps",
  description: "Get all our stupid apps at a massive discount. Because why buy one when you can have them all?",
};

export default async function BundlePage() {
  const apps = await getAllApps();
  const totalValue = apps.reduce((sum, app) => sum + app.price, 0);
  const bundlePrice = Math.round(totalValue * 0.6);
  const savings = totalValue - bundlePrice;
  const savingsPercent = Math.round((savings / totalValue) * 100);

  const emojiMap: Record<string, string> = {
    "slap-o-meter": "👋",
    "excuse-generator": "🤥",
    "roast-my-selfie": "🔥",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🎁</div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          The <span className="gradient-text">Stupidity Bundle</span>
        </h1>
        <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
          Why settle for one stupid app when you can have them all?
          Get every app in our collection at a massive discount.
        </p>
      </div>

      {/* Apps included */}
      <div className="space-y-4 mb-10">
        {apps.map((app) => (
          <div
            key={app.slug}
            className="bg-card border border-white/5 rounded-xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-2xl shrink-0">
              {emojiMap[app.slug] || "🤪"}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{app.name}</h3>
              <p className="text-sm text-foreground/50">{app.tagline}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-foreground/40 line-through text-sm">
                {formatPrice(app.price)}
              </span>
              <span className="ml-2 text-green-400 text-sm font-medium">
                Included
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border border-primary/30 rounded-2xl p-8 md:p-12 text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-2xl text-foreground/40 line-through">
            {formatPrice(totalValue)}
          </span>
          <span className="bg-green-500/20 text-green-400 text-sm font-bold px-3 py-1 rounded-full">
            SAVE {savingsPercent}%
          </span>
        </div>
        <div className="text-5xl md:text-6xl font-extrabold mb-2 gradient-text">
          {formatPrice(bundlePrice)}
        </div>
        <p className="text-foreground/50 mb-8">
          One payment. All apps. All future updates. No regrets (probably).
        </p>
        <form action="/api/checkout" method="POST">
          <input type="hidden" name="bundle" value="true" />
          <button
            type="submit"
            className="bg-accent hover:bg-accent-light text-black font-bold px-12 py-4 rounded-xl text-xl transition-colors animate-pulse-glow"
          >
            Buy the Bundle
          </button>
        </form>
        <p className="text-xs text-foreground/30 mt-4">
          Includes all current and future apps added to the collection.
        </p>
      </div>
    </div>
  );
}
