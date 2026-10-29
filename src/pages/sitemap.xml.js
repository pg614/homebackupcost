import { LAUNCH_STATES } from '../data/site.js';
import { execSync } from 'node:child_process';
const lastmod = (() => { try { return execSync('git log -1 --format=%cs', { encoding:'utf8' }).trim(); } catch { return '2026-10-25'; } })();
const paths = ['/','/calculator/','/portable-power-stations/','/whole-home-battery-cost/','/what-size-battery-generator/','/rebates/',...LAUNCH_STATES.map(s=>`/rebates/${s.toLowerCase()}/`),'/solar-backup/','/standby-generator-installation-cost/','/powerwall-installation-cost/','/questions-to-ask-backup-power-installer/','/backup-power-installer-red-flags/','/how-to-compare-backup-power-quotes/','/transfer-switch-vs-interlock-kit/','/winter-storm-power-outage-heat/','/power-station-vs-generator-cost/','/generator-safety/','/cpap-medical-device-power-outage/','/wildfire-psps-power-shutoff/','/hurricane-power-outage-week/','/72-hour-power-outage-plan/','/build-your-own-home-power-plant/','/quotes/','/federal-tax-credits-ended/','/about/','/affiliate-disclosure/','/privacy/','/methodology/','/contact/'];
export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p=>`  <url><loc>https://homebackupcost.com${p}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
