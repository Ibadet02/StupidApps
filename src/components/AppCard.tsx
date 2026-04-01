import Link from "next/link";
import { formatPrice } from "@/lib/apps";

interface AppCardProps {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  imageUrl: string;
  featured: boolean;
}

export default function AppCard({
  slug,
  name,
  tagline,
  price,
  featured,
}: AppCardProps) {
  return (
    <Link
      href={`/apps/${slug}`}
      className="group relative bg-card hover:bg-card-hover border border-white/5 hover:border-primary/30 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10"
    >
      {featured && (
        <span className="absolute -top-2 -right-2 bg-accent text-black text-xs font-bold px-2 py-1 rounded-full">
          HOT
        </span>
      )}
      <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:animate-pulse-glow">
        {name.includes("Slap") && "👋"}
        {name.includes("Excuse") && "🤥"}
        {name.includes("Roast") && "🔥"}
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-primary-light transition-colors">
        {name}
      </h3>
      <p className="text-sm text-foreground/60 mb-4 line-clamp-2">{tagline}</p>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-accent">
          {formatPrice(price)}
        </span>
        <span className="text-sm text-primary-light font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          View Details &rarr;
        </span>
      </div>
    </Link>
  );
}
