import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-white/10 bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold gradient-text">
          StupidApps
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/bundle"
            className="text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            Bundle Deal
          </Link>
          <Link
            href="/blog"
            className="text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/bundle"
            className="bg-accent hover:bg-accent-light text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Get All Apps
          </Link>
        </nav>
      </div>
    </header>
  );
}
