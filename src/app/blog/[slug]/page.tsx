import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";

function getPost(slug: string) {
  const filePath = path.join(process.cwd(), "src/content/blog", `${slug}.mdx`);

  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    frontmatter: data,
    content,
  };
}

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), "src/content/blog");

  if (!fs.existsSync(contentDir)) return [];

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"));
  return files.map((f) => ({ slug: f.replace(".mdx", "") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.frontmatter.title} — StupidApps Blog`,
    description: post.frontmatter.description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/blog"
        className="text-sm text-foreground/50 hover:text-foreground transition-colors mb-8 inline-block"
      >
        &larr; Back to blog
      </Link>

      <article>
        <header className="mb-8">
          <div className="text-5xl mb-4">{post.frontmatter.emoji || "📝"}</div>
          <h1 className="text-4xl font-extrabold mb-2">
            {post.frontmatter.title}
          </h1>
          <time className="text-sm text-foreground/40">
            {post.frontmatter.date}
          </time>
        </header>

        <div className="prose prose-invert prose-lg max-w-none [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_p]:text-foreground/70 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:text-foreground/70 [&_li]:mb-2 [&_a]:text-primary-light [&_a]:underline [&_strong]:text-foreground [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/50">
          <MDXRemote source={post.content} />
        </div>
      </article>

      <div className="mt-12 pt-8 border-t border-white/10 text-center">
        <Link
          href="/blog"
          className="text-primary-light hover:text-primary font-medium transition-colors"
        >
          &larr; Read more stupid stories
        </Link>
      </div>
    </div>
  );
}
