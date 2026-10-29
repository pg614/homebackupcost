import { LAUNCH_STATES } from '../data/site.js';
const paths = ['/','/calculator/','/portable-power-stations/','/whole-home-battery-cost/','/what-size-battery-generator/','/rebates/',...LAUNCH_STATES.map(s=>`/rebates/${s.toLowerCase()}/`),'/solar-backup/','/standby-generator-installation-cost/','/powerwall-installation-cost/','/questions-to-ask-backup-power-installer/','/backup-power-installer-red-flags/','/how-to-compare-backup-power-quotes/','/transfer-switch-vs-interlock-kit/','/winter-storm-power-outage-heat/','/hurricane-power-outage-week/','/72-hour-power-outage-plan/','/build-your-own-home-power-plant/','/quotes/','/federal-tax-credits-ended/','/about/','/affiliate-disclosure/','/privacy/'];
export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p=>`  <url><loc>https://homebackupcost.com${p}</loc><lastmod>2026-10-25</lastmod></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
