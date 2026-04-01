import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Successful — StupidApps",
};

export default function SuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-7xl mb-6">🎉</div>
      <h1 className="text-4xl font-extrabold mb-4">
        You are now officially <span className="gradient-text">stupid</span>.
      </h1>
      <p className="text-xl text-foreground/60 mb-8">
        (In the best way possible.) Your purchase was successful!
        Check your email for download instructions.
      </p>
      <div className="bg-card border border-white/5 rounded-2xl p-8 mb-8">
        <h2 className="text-lg font-bold mb-3">What happens now?</h2>
        <ul className="text-foreground/60 text-sm space-y-2 text-left">
          <li>1. Check your email for the download link</li>
          <li>2. Download and install the app</li>
          <li>3. Show it to everyone you know</li>
          <li>4. Record a video and tag us for maximum chaos</li>
        </ul>
      </div>
      <Link
        href="/"
        className="text-primary-light hover:text-primary font-medium transition-colors"
      >
        &larr; Browse more stupid apps
      </Link>
    </div>
  );
}
