import HeroSection from "@/components/HeroSection";
import AppCard from "@/components/AppCard";
import BundleBanner from "@/components/BundleBanner";
import { getAllApps } from "@/lib/apps";

export default async function Home() {
  const apps = await getAllApps();
  const totalValue = apps.reduce((sum, app) => sum + app.price, 0);
  const bundlePrice = Math.round(totalValue * 0.6);

  return (
    <>
      <HeroSection />

      <section id="apps" className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold mb-2">The Collection</h2>
          <p className="text-foreground/50">
            Each one more unnecessary than the last.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <AppCard
              key={app.slug}
              slug={app.slug}
              name={app.name}
              tagline={app.tagline}
              price={app.price}
              imageUrl={app.imageUrl}
              featured={app.featured}
              demoUrl={app.demoUrl}
            />
          ))}
        </div>
      </section>

      <BundleBanner
        appCount={apps.length}
        totalValue={totalValue}
        bundlePrice={bundlePrice}
      />
    </>
  );
}
