// The layout owns the `#main` landmark (src/app/[lang]/layout.tsx) — a page
// does not get its own <main>, or the document ships two and the skip link's
// #main target becomes a duplicate id.
import { Hero } from '@/components/sections/hero';

export default function Page() {
  return <Hero />;
}
