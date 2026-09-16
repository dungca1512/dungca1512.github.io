import { Hero } from '@/components/sections/hero';
import { ProofBar } from '@/components/sections/proof-bar';
import { Expertise } from '@/components/sections/expertise';
import { Work } from '@/components/sections/work';
import { Experience } from '@/components/sections/experience';
import { Capabilities } from '@/components/sections/capabilities';

export default function Page() {
  return (
    <>
      <Hero />
      <ProofBar />
      <Expertise />
      <Work />
      <Experience />
      <Capabilities />
    </>
  );
}
