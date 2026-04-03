import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppBySlug, getAllApps, formatPrice } from "@/lib/apps";
import FAQ from "@/components/FAQ";

const appFAQs: Record<string, { question: string; answer: string }[]> = {
  "slap-o-meter": [
    {
      question: "Will this break my phone?",
      answer:
        "Probably not, but we're not responsible if you go full WWE on it. Slap responsibly.",
    },
    {
      question: "How accurate is the slap rating?",
      answer:
        "Our advanced Slap Intelligence (SI) algorithm uses your phone's accelerometer. It's at least as accurate as a horoscope.",
    },
    {
      question: "Can I challenge my friends?",
      answer:
        "Yes! Share your slap score card on social media and watch friendships crumble over who slaps hardest.",
    },
  ],
  "excuse-generator": [
    {
      question: "Will my boss believe these excuses?",
      answer:
        "They're so absurd that your boss will be too confused to question them. That's the strategy.",
    },
    {
      question: "How many excuses are there?",
      answer:
        "Algorithmically generated, so technically infinite. You'll never use the same excuse twice (unless it's a really good one).",
    },
    {
      question: "Is there a 'relationship mode'?",
      answer:
        "Yes. We call it 'Survival Mode'. Use at your own risk.",
    },
  ],
  "roast-my-selfie": [
    {
      question: "How brutal are the roasts?",
      answer:
        "There's a slider from 'Gentle Tease' to 'Career-Ending Burn'. Start low if you're emotionally fragile.",
    },
    {
      question: "Is my photo stored anywhere?",
      answer:
        "Nope. Your photo is processed and immediately forgotten, just like your ex did.",
    },
    {
      question: "Can I roast my friends' photos?",
      answer:
        "Absolutely. Upload their selfie and share the roast card. Best used at parties.",
    },
  ],
  "chargegasm": [
    {
      question: "How does it detect when I plug in?",
      answer:
        "It monitors your system's power state. The moment your charger connects or disconnects, your laptop reacts. Instantly.",
    },
    {
      question: "Can I use this in a library?",
      answer:
        "You CAN. Should you? That's between you and your conscience. We recommend maximum volume.",
    },
    {
      question: "Does it work on battery-only devices?",
      answer:
        "You need a device with a removable charger (laptop). Desktop PCs are always plugged in, so... no drama there.",
    },
  ],
  "typing-sounds": [
    {
      question: "Will this annoy my coworkers?",
      answer:
        "Absolutely. That's the primary feature. We recommend the Moaning pack for maximum office chaos.",
    },
    {
      question: "Does it work on mobile?",
      answer:
        "Yes! Tap the text area and type on your phone keyboard. Every tap makes a sound. Your bus commute will never be the same.",
    },
    {
      question: "Can I use real sound files instead of synthesized ones?",
      answer:
        "The current version uses synthesized sounds that work instantly in your browser. No downloads needed.",
    },
  ],
};

export async function generateStaticParams() {
  const apps = await getAllApps();
  return apps.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = await getAppBySlug(slug);
  if (!app) return { title: "App Not Found" };
  return {
    title: `${app.name} — StupidApps`,
    description: app.tagline,
  };
}

export default async function AppPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = await getAppBySlug(slug);
  if (!app) notFound();

  const faqs = appFAQs[slug] || [];

  const emojiMap: Record<string, string> = {
    "slap-o-meter": "👋",
    "excuse-generator": "🤥",
    "roast-my-selfie": "🔥",
    "typing-sounds": "⌨️",
    "chargegasm": "🔌",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="text-sm text-foreground/50 hover:text-foreground transition-colors mb-8 inline-block"
      >
        &larr; Back to all apps
      </Link>

      {/* Hero */}
      <div className="text-center mb-12">
        <div className="text-7xl mb-6 animate-float">
          {emojiMap[slug] || "🤪"}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          {app.name}
        </h1>
        <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
          {app.tagline}
        </p>
      </div>

      {/* Try Free Button */}
      {app.demoUrl && (
        <div className="text-center mb-8">
          <Link
            href={app.demoUrl}
            className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-10 py-4 rounded-xl text-lg transition-colors"
          >
            Try it Free
          </Link>
          <p className="text-sm text-foreground/40 mt-2">
            3 free uses. No sign-up required.
          </p>
        </div>
      )}

      {/* Download Desktop App */}
      {(slug === "typing-sounds" || slug === "chargegasm") && (
        <div className="bg-card border border-white/5 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold mb-2 text-center">
            Download Desktop App
          </h2>
          <p className="text-foreground/50 text-sm text-center mb-6">
            {slug === "chargegasm"
              ? "Your laptop reacts to charging — moans, screams, and more."
              : "Works system-wide — every keypress in ANY app makes a sound."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={slug === "chargegasm"
                ? "https://github.com/Ibadet02/ChargeGasm/releases/download/v1.0.0/ChargeGasm-1.0.0-mac.zip"
                : "https://github.com/Ibadet02/TypingSoundCustomizer/releases/download/v1.0.6/Typing.Sound.Customizer-1.0.0-mac.zip"}
              className="flex items-center justify-center gap-2 bg-surface border border-white/10 hover:border-primary/30 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
            >
              <span>🍎</span> macOS
            </a>
            <a
              href={slug === "chargegasm"
                ? "https://github.com/Ibadet02/ChargeGasm/releases/download/v1.0.0/ChargeGasm-1.0.0.AppImage"
                : "https://github.com/Ibadet02/TypingSoundCustomizer/releases/download/v1.0.6/Typing.Sound.Customizer-1.0.0.AppImage"}
              className="flex items-center justify-center gap-2 bg-surface border border-white/10 hover:border-primary/30 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
            >
              <span>🐧</span> Linux
            </a>
          </div>
          <p className="text-xs text-foreground/30 text-center mt-3">
            Purchase a license key to unlock unlimited use.
          </p>
        </div>
      )}

      {/* Description */}
      <div className="bg-card border border-white/5 rounded-2xl p-8 mb-8">
        <h2 className="text-xl font-bold mb-4">What is this madness?</h2>
        <p className="text-foreground/70 leading-relaxed">{app.description}</p>
      </div>

      {/* Price & Buy */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20 rounded-2xl p-8 mb-8 text-center">
        <div className="text-4xl font-extrabold mb-2 gradient-text">
          {formatPrice(app.price)}
        </div>
        <p className="text-foreground/50 text-sm mb-6">
          One-time purchase. No subscriptions. No hidden fees. Just pure
          stupidity.
        </p>
        <form action="/api/checkout" method="POST">
          <input type="hidden" name="appSlug" value={app.slug} />
          <button
            type="submit"
            className="bg-accent hover:bg-accent-light text-black font-bold px-10 py-4 rounded-xl text-lg transition-colors animate-pulse-glow"
          >
            Buy Now
          </button>
        </form>
      </div>

      {/* FAQ */}
      {faqs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <FAQ items={faqs} />
        </div>
      )}

      {/* Back to catalog */}
      <div className="text-center">
        <Link
          href="/"
          className="text-primary-light hover:text-primary font-medium transition-colors"
        >
          &larr; See more stupid apps
        </Link>
      </div>
    </div>
  );
}
