import { Hero } from '@/components/sections/hero';
import { ProofBar } from '@/components/sections/proof-bar';
import { Expertise } from '@/components/sections/expertise';
import { Work } from '@/components/sections/work';
import { Experience } from '@/components/sections/experience';
import { Capabilities } from '@/components/sections/capabilities';
import { Analytics } from '@/components/sections/analytics';
import { Writing } from '@/components/sections/writing';
import { Contact } from '@/components/sections/contact';

/* Nine bands, STRICTLY alternating plain and muted, ending dark. The order is
   the argument: who this is, proof, what he can do, what he built, where he did
   it, how he works, the numbers, what he has written, how to reach him.
   The alternation is a rule, not a rhythm: it used to run
   plain-muted-muted-plain-muted-plain-muted-muted-dark, and both of those
   doubles were a seam where a reader crossed into a new section with nothing
   on screen changing. Adding a band means giving it the colour its neighbours
   do not have — check the two beside it before you pick. */
export default function Page() {
  return (
    <>
      <Hero />
      <ProofBar />
      <Expertise />
      <Work />
      <Experience />
      <Capabilities />
      <Analytics />
      <Writing />
      <Contact />
    </>
  );
}
