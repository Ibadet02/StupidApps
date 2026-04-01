import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <div className="text-6xl md:text-8xl mb-6 animate-float">
          🤪
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
          <span className="gradient-text">Apps That Shouldn&apos;t Exist.</span>
          <br />
          <span className="text-foreground">But Do.</span>
        </h1>
        <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto mb-8">
          A collection of gloriously useless, hilariously stupid, and
          surprisingly addictive apps. Built for laughs. Priced for impulse buys.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#apps"
            className="bg-primary hover:bg-primary-light text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
          >
            Browse the Madness
          </a>
          <Link
            href="/bundle"
            className="bg-accent hover:bg-accent-light text-black font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
          >
            Get the Bundle
          </Link>
        </div>
      </div>
    </section>
  );
}
