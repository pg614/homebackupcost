import { national } from '../../data/site.js';
export function GET() {
  const cols = ['state','hear','homes','note','source_url','as_of'];
  const q = (v) => `"${String(v ?? '').replace(/"/g,'""')}"`;
  return new Response([cols.join(','), ...national.map(r => cols.map(c => q(r[c])).join(','))].join('\n'), { headers: { 'Content-Type': 'text/csv' } });
}
