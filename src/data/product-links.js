// ONE place for every product's outbound "buy" link.
// `brand_url` = the maker's own product page (verified 200 + correct model, 2026-11-03).
// When a CJ / affiliate program approves us, put the tracking URL in `aff_url` — every
// table, card, button and calculator on the site switches automatically.
export const PRODUCT_LINKS = {
  'EcoFlow DELTA Pro Ultra':        { brand:'EcoFlow', brand_url:'https://us.ecoflow.com/products/delta-pro-ultra', aff_url:'' },
  'EcoFlow DELTA Pro 3':            { brand:'EcoFlow', brand_url:'https://us.ecoflow.com/products/delta-pro-3-portable-power-station', aff_url:'' },
  'EcoFlow RIVER 2 Pro':            { brand:'EcoFlow', brand_url:'https://us.ecoflow.com/products/river-2-pro-portable-power-station', aff_url:'' },
  'Anker SOLIX F3800 Plus':         { brand:'Anker SOLIX', brand_url:'https://www.ankersolix.com/products/f3800-plus', aff_url:'' },
  'Anker SOLIX C1000':              { brand:'Anker SOLIX', brand_url:'https://www.anker.com/products/a1761', aff_url:'' },
  'Jackery Explorer 5000 Plus':     { brand:'Jackery', brand_url:'https://www.jackery.com/products/jackery-explorer-5000-plus', aff_url:'' },
  'Jackery Explorer 2000 v2':       { brand:'Jackery', brand_url:'https://www.jackery.com/products/explorer-2000-v2-series', aff_url:'' },
  'Jackery Explorer 1000 v2':       { brand:'Jackery', brand_url:'https://www.jackery.com/products/jackery-explorer-1000-v2', aff_url:'' },
  'BLUETTI Apex 300':               { brand:'BLUETTI', brand_url:'https://www.bluettipower.com/collections/apex-30', aff_url:'' },
  'Bluetti Elite 200 v2':           { brand:'BLUETTI', brand_url:'https://www.bluettipower.com/products/elite-200-v2-portable-power-station', aff_url:'' },
  'Goal Zero Yeti 1500X':           { brand:'Goal Zero', brand_url:'https://goalzero.com/products/goal-zero-yeti-1500x-portable-power-station', aff_url:'' },
  'Tesla Powerwall 3':              { brand:'Tesla', brand_url:'https://www.tesla.com/powerwall', aff_url:'' },
  'FranklinWH aPower 2':            { brand:'FranklinWH', brand_url:'https://www.franklinwh.com/products/apower2-home-battery-backup/', aff_url:'' },
  // expansion batteries
  'EcoFlow DELTA Pro Ultra (Series) Smart Extra Battery': { brand:'EcoFlow', brand_url:'https://us.ecoflow.com/products/delta-pro-ultra-x-smart-extra-battery', aff_url:'' },
  'EcoFlow DELTA Pro 3 Smart Extra Battery': { brand:'EcoFlow', brand_url:'https://us.ecoflow.com/products/delta-pro-3-extra-battery', aff_url:'' },
  'Anker SOLIX BP3800 Expansion Battery':    { brand:'Anker SOLIX', brand_url:'https://www.ankersolix.com/products/bp3800-expansion-battery', aff_url:'' },
  'Jackery Battery Pack 5000 Plus':          { brand:'Jackery', brand_url:'https://www.jackery.com/products/jackery-battery-pack-5000-plus', aff_url:'' },
  'BLUETTI B300K Expansion Battery':         { brand:'BLUETTI', brand_url:'https://www.bluettipower.com/products/b300k', aff_url:'' },
};
const norm = (s) => String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const IDX = Object.fromEntries(Object.entries(PRODUCT_LINKS).map(([k,v]) => [norm(k), { name:k, ...v }]));
// Returns { name, brand, url, affiliate } or null.
export const productLink = (name) => { const p = IDX[norm(name)]; return p ? { name:p.name, brand:p.brand, url:p.aff_url || p.brand_url, affiliate: !!p.aff_url } : null; };
// Plain object for client-side scripts (calculators).
export const PRODUCT_URLS = Object.fromEntries(Object.keys(PRODUCT_LINKS).map(k => [k, productLink(k)]));
