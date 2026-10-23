import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Container } from "@/components/ui";
import type { Post } from "@/content/blog";

/** A short list of related guides: keeps guides, cities and industries linked to each other. */
export function GuideLinks({ title, posts, limit = 3 }: { title: string; posts: Post[]; limit?: number }) {
  if (!posts.length) return null;
  return (
    <Container className="mt-16">
      <h2 data-reveal className="text-2xl">{title}</h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {posts.slice(0, limit).map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="card lift group flex h-full flex-col p-5">
              <BookOpen className="h-5 w-5 text-gold" aria-hidden="true" />
              <span className="mt-3 font-semibold leading-snug">{p.title}</span>
              <span className="mt-2 line-clamp-3 text-sm text-fg-2">{p.description}</span>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-brand">
                Read the guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
