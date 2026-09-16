// The layout owns the `#main` landmark (src/app/[lang]/layout.tsx) — a page
// does not get its own <main>, or the document ships two and the skip link's
// #main target becomes a duplicate id. This placeholder is replaced by
// <Hero /> in Task 8.
export default function Page() {
  return <>Portfolio</>;
}
