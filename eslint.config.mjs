import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  { ignores: ['out/**', '.next/**', 'node_modules/**', '.playwright-mcp/**'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default config;
