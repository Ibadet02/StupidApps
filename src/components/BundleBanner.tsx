import Link from "next/link";

interface BundleBannerProps {
  appCount: number;
  totalValue: number;
  bundlePrice: number;
}

export default function BundleBanner({
  appCount,
  totalValue,
  bundlePrice,
}: BundleBannerProps) {
  const savings = totalValue - bundlePrice;
  const savingsPercent = Math.round((savings / totalValue) * 100);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border border-primary/20 rounded-2xl p-8 md:p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="relative">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">
            Bundle Deal
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4">
            Get All {appCount} Apps for{" "}
            <span className="gradient-text">
              ${(bundlePrice / 100).toFixed(0)}
            </span>
          </h2>
          <p className="text-foreground/60 mb-6 max-w-lg mx-auto">
            Save {savingsPercent}% compared to buying individually.
            That&apos;s ${(savings / 100).toFixed(2)} worth of premium stupidity
            — for free.
          </p>
          <Link
            href="/bundle"
            className="inline-block bg-accent hover:bg-accent-light text-black font-bold px-8 py-3 rounded-lg transition-colors text-lg"
          >
            Grab the Bundle
          </Link>
        </div>
      </div>
    </section>
  );
}
