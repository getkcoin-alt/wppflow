import Link from "next/link";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-4xl">This page has moved or never existed</h1>
      <p className="mt-4 text-fg-2">Try the home page, or tell us what you were looking for.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">Home</Link>
        <Link href="/contact" className="btn-ghost">Contact</Link>
      </div>
    </Container>
  );
}
