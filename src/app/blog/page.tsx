import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — StupidApps",
  description: "Stories, updates, and behind-the-scenes of the stupidest apps on the internet.",
};

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  emoji: string;
}

function getBlogPosts(): BlogPost[] {
  const contentDir = path.join(process.cwd(), "src/content/blog");

  if (!fs.existsSync(contentDir)) return [];

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const filePath = path.join(contentDir, filename);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);

      return {
        slug: filename.replace(".mdx", ""),
        title: data.title || "Untitled",
        description: data.description || "",
        date: data.date || "",
        emoji: data.emoji || "📝",
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4">
          The <span className="gradient-text">Stupid Blog</span>
        </h1>
        <p className="text-foreground/60">
          Behind the scenes of building the world&apos;s most unnecessary apps.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏗️</div>
          <p className="text-foreground/50">
            Blog posts coming soon. We&apos;re too busy building stupid apps.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-card hover:bg-card-hover border border-white/5 hover:border-primary/20 rounded-2xl p-6 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl shrink-0">{post.emoji}</div>
                <div>
                  <h2 className="text-xl font-bold mb-1 group-hover:text-primary-light">
                    {post.title}
                  </h2>
                  <p className="text-foreground/50 text-sm mb-2">
                    {post.description}
                  </p>
                  <time className="text-xs text-foreground/30">{post.date}</time>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
