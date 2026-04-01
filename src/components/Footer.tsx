import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface/50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-lg font-bold gradient-text">
              StupidApps
            </Link>
            <p className="text-sm text-foreground/50 mt-1">
              Apps that shouldn&apos;t exist. But do.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-foreground/50">
            <Link href="/bundle" className="hover:text-foreground transition-colors">
              Bundle
            </Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-foreground/30">
          &copy; {new Date().getFullYear()} StupidApps. All rights reserved. No refunds on stupidity.
        </div>
      </div>
    </footer>
  );
}
