import data from '../../public/github-data.json';

/** Reads a dotted path out of the GitHub dump at BUILD time. There is no
 *  runtime fetch: this is a static export, and a fetch would mean the numbers
 *  are blank on first paint and different for every visitor. */
export function githubStat(path: string, fallback: number): number {
  const value = path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], data);
  return typeof value === 'number' ? value : fallback;
}
