// Pure calculator math, shared by the browser island and the test script.
// items: [{name, runMin, runMax, startMax, qty, hours}]
export function calculate(items, durationHours, usable = 0.85) {
  const days = durationHours / 24;
  let runSum = 0, maxDelta = 0, dailyWh = 0;
  for (const it of items) {
    const runTyp = (it.runMin + it.runMax) / 2;          // ESTIMATE: midpoint of sourced range
    runSum += it.runMax * it.qty;                        // conservative peak uses max running W
    const start = it.startMax || it.runMax;
    maxDelta = Math.max(maxDelta, start - it.runMax);    // largest single motor surge
    dailyWh += runTyp * it.qty * Math.min(it.hours, 24);
  }
  const rawKwh = dailyWh * days / 1000;
  const kwh = rawKwh / usable;
  return { runningW: runSum, peakW: runSum + maxDelta, surgeExtraW: maxDelta, dailyKwh: dailyWh / 1000, rawKwh, kwh };
}
export function matchBatteries(r, batteries, priceLow, expansions = [], perKwh = [1130, 1159]) {
  const portable = [], installed = [];
  for (const b of batteries) {
    if (!b.capacity_kwh || !b.output_w) continue;
    if (b.type.startsWith('installed')) {
      const units = Math.max(1, Math.ceil(r.kwh / b.capacity_kwh));
      const cap = units * b.capacity_kwh;
      installed.push({ ...b, units, powerOk: b.output_w * units >= r.runningW && b.surge_w * units >= r.peakW,
        costLow: Math.round(cap * perKwh[0] / 100) * 100, costHigh: Math.round(cap * perKwh[1] / 100) * 100 });
    } else {
      // If a surge rating isn't captured, require continuous output to cover the full peak (conservative).
      const powerOk = b.output_w >= r.runningW && (b.surge_w ? b.surge_w >= r.peakW : b.output_w >= r.peakW);
      const coverPct = Math.min(100, Math.round(b.capacity_kwh / r.kwh * 100));
      const units = Math.ceil(r.kwh / b.capacity_kwh);
      portable.push({ ...b, powerOk, coverPct, unitsNeeded: units, price: priceLow(b.price), fullCover: b.capacity_kwh >= r.kwh });
    }
  }
  portable.sort((a, b) => (b.powerOk - a.powerOk) || (b.fullCover - a.fullCover) || (a.fullCover ? ((a.price ?? 1e9) - (b.price ?? 1e9)) : (b.coverPct - a.coverPct)));
  const systems = [];
  for (const b of portable) {
    const e = expansions.find(x => x.base === b.product);
    if (!e || !b.powerOk || b.fullCover || b.price == null) continue;
    const n = Math.ceil((r.kwh - b.capacity_kwh) / e.capacity_kwh - 1e-9);
    if (n < 1 || n > e.max_per_base) continue;
    const cap = b.capacity_kwh + n * e.capacity_kwh;
    systems.push({ base: b, exp: e, n, capacityKwh: cap, totalPrice: Math.round((b.price + n * e.price) * 100) / 100 });
  }
  systems.sort((a, b) => a.totalPrice - b.totalPrice || a.capacityKwh - b.capacityKwh);
  const genRunning = Math.ceil(r.runningW / 500) * 500;
  return { portable, systems, installed, generator: { runningW: genRunning, startingW: Math.ceil(r.peakW / 500) * 500 } };
}

// Quick Check answer -> appliance list (subset of the full calculator presets).
export const QUICK_PRESETS = {
  essentials: [['Refrigerator', 1], ['Router/modem (Wi-Fi)', 1], ['LED bulb (each)', 6], ['Phone/laptop charger', 1]],
  climate: [['Refrigerator', 1], ['Router/modem (Wi-Fi)', 1], ['LED bulb (each)', 6], ['Phone/laptop charger', 1], ['Furnace fan 1/2 HP', 1]],
  whole: [['Refrigerator', 1], ['Freezer', 1], ['Furnace fan 1/2 HP', 1], ['Well pump 1/2 HP', 1], ['Microwave', 1], ['Washing machine', 1], ['TV 32-55in', 1], ['LED bulb (each)', 6], ['Router/modem (Wi-Fi)', 1], ['Phone/laptop charger', 1], ['Window AC 10,000 BTU', 1]],
  medical: [['Refrigerator', 1], ['CPAP heated humidifier', 1], ['Router/modem (Wi-Fi)', 1], ['LED bulb (each)', 6], ['Phone/laptop charger', 1]],
};
export function quickItems(key, appliances, hoursMap) {
  return (QUICK_PRESETS[key] || []).map(([name, qty]) => {
    const a = appliances.find(x => (x.appliance || x.name) === name);
    return { name, runMin: a.running_w_min ?? a.runMin, runMax: a.running_w_max ?? a.runMax, startMax: (a.starting_w_max ?? a.startMax) || null, qty, hours: hoursMap[name] ?? 4 };
  });
}
// Solar recharge (ASSUMPTIONS: peak sun hours and derate passed in, labeled in UI).
export function solarNeeds(dailyKwh, kwhNeeded, psh = 4, derate = 0.75) {
  const perWattDayKwh = psh * derate / 1000;            // kWh one panel-watt makes per day
  const wattsToCoverDaily = Math.ceil(dailyKwh / perWattDayKwh / 50) * 50;
  return { perWattDayKwh, wattsToCoverDaily, daysToRefill: (w) => kwhNeeded / (w * perWattDayKwh) };
}
