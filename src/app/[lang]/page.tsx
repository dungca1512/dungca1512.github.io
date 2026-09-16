import { Hero } from '@/components/sections/hero';
import { ProofBar } from '@/components/sections/proof-bar';
import { Expertise } from '@/components/sections/expertise';
import { Work } from '@/components/sections/work';
import { Experience } from '@/components/sections/experience';
import { Capabilities } from '@/components/sections/capabilities';
import { Analytics } from '@/components/sections/analytics';
import { Writing } from '@/components/sections/writing';
import { Contact } from '@/components/sections/contact';

/* Eight bands, alternating plain / muted / blueprint, ending dark. The order is
   the argument: who this is, proof, what he can do, what he built, where he did
   it, how he works, what he has written, how to reach him. */
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
