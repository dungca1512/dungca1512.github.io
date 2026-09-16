import { Container } from '@/components/site/container';
import { CountUp } from '@/components/motion/count-up';
import { MetricGlyph } from '@/components/site/metric-glyph';
import { RevealScope } from '@/components/motion/reveal-scope';
import { METRICS } from '@/content/metrics';
import { getLocale } from '@/content/dictionaries';
import { BCP47 } from '@/content/locales';

export async function ProofBar() {
  const locale = await getLocale();

  return (
    <section className="border-border band-muted border-y py-12">
      <RevealScope>
        <Container>
          <dl className="stagger grid grid-cols-2 gap-8 md:grid-cols-4">
            {METRICS.map((metric, i) => (
              <div key={metric.key} className="reveal" style={{ '--i': i } as React.CSSProperties}>
                {/* The mark sits INSIDE the <dt>, not beside it: a <div> in a
                    <dl> may contain nothing but <dt> and <dd>, so an <svg> as
                    a third child here would be invalid and check:export would
                    be the thing that found out. It is `aria-hidden` inside the
                    component, so it adds nothing to the term's announcement. */}
                <dt className="text-muted-foreground text-sm">
                  <MetricGlyph metricKey={metric.key} />
                  <span className="mt-3 block">{metric.label[locale]}</span>
                </dt>
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
