import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-7xl mb-6">🤷</div>
      <h1 className="text-4xl font-extrabold mb-4">
        404 — Not <span className="gradient-text">Stupid</span> Enough
      </h1>
      <p className="text-xl text-foreground/60 mb-8">
        This page doesn&apos;t exist. Maybe it was too smart and we had to remove it.
      </p>
      <Link
        href="/"
        className="bg-primary hover:bg-primary-light text-white font-semibold px-8 py-3 rounded-lg transition-colors"
      >
        Back to Stupidity
      </Link>
    </div>
  );
}
