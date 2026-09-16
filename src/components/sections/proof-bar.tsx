import { Container } from '@/components/site/container';
import { CountUp } from '@/components/motion/count-up';
import { RevealScope } from '@/components/motion/reveal-scope';
import { METRICS } from '@/content/metrics';
import { getLocale } from '@/content/dictionaries';
import { BCP47 } from '@/content/locales';

export async function ProofBar() {
  const locale = await getLocale();

  return (
    <section className="border-border bg-surface-muted border-y py-12">
      <RevealScope>
        <Container>
          <dl className="stagger grid grid-cols-2 gap-8 md:grid-cols-4">
            {METRICS.map((metric, i) => (
              <div key={metric.key} className="reveal" style={{ '--i': i } as React.CSSProperties}>
                <dt className="text-muted-foreground text-sm">{metric.label[locale]}</dt>
                <dd className="mt-1 text-[clamp(2rem,4vw,3rem)] leading-none font-semibold tracking-tight tabular-nums">
                  <CountUp value={metric.value} locale={BCP47[locale]} suffix={metric.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </RevealScope>
    </section>
  );
}
