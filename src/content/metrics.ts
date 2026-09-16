import type { Localized } from './locales';
import { githubStat } from '@/lib/github';

export type Metric = {
  key: string;
  value: number;
  suffix: string;
  label: Localized<string>;
};

/** `value` is resolved at build time from public/github-data.json, falling back
 *  to the literal in data.js when the dump has no such stat. Splitting the
 *  number from the suffix is what lets CountUp roll the digits: it cannot
 *  animate "3+". One entry per `PORTFOLIO_DATA.metrics[i]`; `label` is copied
 *  verbatim, `source`/`fallback` are read from data.json for each. */
export const METRICS: Metric[] = [
  {
    key: 'yearsExperience',
    value: githubStat('stats.yearsExperience', 3),
    suffix: '+',
    label: {
      en: 'Years building and operating AI systems in production',
      vi: 'Năm xây dựng và vận hành hệ thống AI trong production',
    },
  },
  {
    key: 'scoringServices',
    value: githubStat('stats.scoringServices', 4),
    suffix: '',
    label: {
      en: 'Speech scoring services live across JP, KR, CN and EN markets',
      vi: 'Dịch vụ chấm phát âm đang chạy cho thị trường Nhật, Hàn, Trung và tiếng Anh',
    },
  },
  {
    key: 'cloudPlatforms',
    value: githubStat('stats.cloudPlatforms', 5),
    suffix: '',
    label: {
      en: 'Cloud platforms in production (GCP, AWS, DigitalOcean, OCI, Cloudflare)',
      vi: 'Nền tảng cloud dùng thực tế (GCP, AWS, DigitalOcean, OCI, Cloudflare)',
    },
  },
  {
    key: 'hfModels',
    value: githubStat('stats.hfModels', 3),
    suffix: '',
    label: {
      en: 'Japanese ASR models published on Hugging Face',
      vi: 'Mô hình ASR tiếng Nhật đã công bố trên Hugging Face',
    },
  },
];
