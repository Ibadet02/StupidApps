"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface LicenseInfo {
  key: string;
  appSlug: string;
}

interface PurchaseData {
  email: string;
  isBundle: boolean;
  appSlug: string | null;
  licenses: LicenseInfo[];
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retries, setRetries] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Webhook may not have fired yet, so retry a few times
    const fetchPurchase = async () => {
      try {
        const res = await fetch(`/api/purchase?session_id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.licenses && data.licenses.length > 0) {
            setPurchase(data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore, will retry
      }

      // Retry up to 10 times (webhook might be delayed)
      if (retries < 10) {
        setTimeout(() => setRetries((r) => r + 1), 2000);
      } else {
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [sessionId, retries]);

  const copyKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-7xl mb-6">🎉</div>
      <h1 className="text-4xl font-extrabold mb-4">
        You are now officially <span className="gradient-text">stupid</span>.
      </h1>
      <p className="text-xl text-foreground/60 mb-8">
        (In the best way possible.) Your purchase was successful!
      </p>

      {loading ? (
        <div className="bg-card border border-white/5 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-center gap-3">
            <svg
              className="animate-spin h-5 w-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-foreground/60">
              Generating your license key...
            </span>
          </div>
        </div>
      ) : purchase && purchase.licenses.length > 0 ? (
        <div className="bg-card border border-white/5 rounded-2xl p-8 mb-8 text-left">
          <h2 className="text-lg font-bold mb-4 text-center">
            Your License {purchase.licenses.length > 1 ? "Keys" : "Key"}
          </h2>

          <div className="space-y-4">
            {purchase.licenses.map((license) => (
              <div
                key={license.key}
                className="bg-surface border border-white/10 rounded-xl p-4"
              >
                <div className="text-sm text-foreground/50 mb-1">
                  {license.appSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </div>
                <div className="flex items-center gap-3">
                  <code className="flex-1 text-lg font-mono text-accent font-bold tracking-wider">
                    {license.key}
                  </code>
                  <button
                    onClick={() => copyKey(license.key)}
                    className="shrink-0 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary-light text-sm rounded-lg transition-colors"
                  >
                    {copied === license.key ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-xl">
            <p className="text-sm text-accent font-medium mb-1">
              Save your license key!
            </p>
            <p className="text-xs text-foreground/50">
              Copy it somewhere safe. You&apos;ll need it to unlock unlimited
              access in the app. Sent to: {purchase.email}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-white/5 rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-bold mb-3">What happens now?</h2>
          <p className="text-foreground/60 text-sm">
            Your payment was processed. Your license key should appear here
            shortly. If it doesn&apos;t, please refresh this page in a few
            seconds.
          </p>
        </div>
      )}

      {/* Download section for desktop apps */}
      {purchase && purchase.licenses.some((l) => l.appSlug === "typing-sounds") && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-bold mb-2">Download Desktop App</h2>
          <p className="text-foreground/50 text-sm mb-4">
            Works system-wide — every keypress in ANY app makes a sound.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <a
              href="https://github.com/Ibadet02/TypingSoundCustomizer/releases/download/v1.0.6/Typing.Sound.Customizer-1.0.0-mac.zip"
              className="flex items-center justify-center gap-2 bg-card border border-white/10 hover:border-primary/30 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
            >
              <span>🍎</span> macOS
            </a>
            <a
              href="https://github.com/Ibadet02/TypingSoundCustomizer/releases/download/v1.0.6/Typing.Sound.Customizer-1.0.0.AppImage"
              className="flex items-center justify-center gap-2 bg-card border border-white/10 hover:border-primary/30 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
            >
              <span>🐧</span> Linux
            </a>
          </div>
          <p className="text-xs text-foreground/30">
            Enter your license key when the app asks to unlock unlimited use.
          </p>
        </div>
      )}

      <div className="bg-card border border-white/5 rounded-2xl p-8 mb-8">
        <h2 className="text-lg font-bold mb-3">How to activate</h2>
        <ul className="text-foreground/60 text-sm space-y-2 text-left">
          {purchase && purchase.licenses.some((l) => l.appSlug === "typing-sounds") ? (
            <>
              <li>1. Download the desktop app above</li>
              <li>2. Open it and enter your license key when prompted</li>
              <li>3. Every keypress now makes sounds system-wide!</li>
            </>
          ) : (
            <>
              <li>1. Go to the app and use your free trial</li>
              <li>2. When the paywall appears, click &quot;Already purchased? Enter license key&quot;</li>
              <li>3. Paste your license key and click Activate</li>
              <li>4. Enjoy unlimited access forever!</li>
            </>
          )}
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

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-7xl mb-6">🎉</div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
