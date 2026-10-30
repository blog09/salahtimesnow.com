// Repeatable accuracy check: our times vs the independent AlAdhan API, same method, a sample of cities and dates.
// Usage: node scripts/check_aladhan.mjs
import { readFileSync } from 'node:fs';
import { times, defaultMethod } from '../src/lib/salah.mjs';

const cities = JSON.parse(readFileSync(new URL('./cities.json', import.meta.url), 'utf8'));
const SAMPLE = ['new-york', 'chicago', 'los-angeles', 'miami', 'seattle', 'toronto', 'calgary', 'london', 'birmingham', 'glasgow'];
const DATES = [[2026, 10, 30], [2027, 2, 8], [2027, 3, 9], [2027, 6, 21], [2026, 12, 21]];
const API = { NorthAmerica: 2, MoonsightingCommittee: 15 };
const KEYS = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const hm = (date, tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
const toMin = (s) => { const [h, m] = s.slice(0, 5).split(':').map(Number); return (h % 24) * 60 + m; };

const diffs = {}; const worst = [];
for (const slug of SAMPLE) {
  const c = cities.find((x) => x.slug === slug), method = defaultMethod(c.country);
  for (const [y, m, d] of DATES) {
    const url = `https://api.aladhan.com/v1/timings/${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}?latitude=${c.lat}&longitude=${c.lon}&method=${API[method]}&timezonestring=${encodeURIComponent(c.tz)}&latitudeAdjustmentMethod=3`;
    const res = await fetch(url, { headers: { 'User-Agent': 'salahtimesnow-check/1.0' } });
    if (!res.ok) { console.log('skip', slug, y, m, d, res.status); continue; }
    const t = (await res.json()).data.timings, p = times(c.lat, c.lon, y, m, d, method);
    for (const [k, api] of Object.entries(KEYS)) {
      let gap = Math.abs(toMin(hm(p[k], c.tz)) - toMin(t[api])); if (gap > 720) gap = 1440 - gap;
      (diffs[k] ??= []).push(gap);
      if (gap > 2) worst.push(`${slug} ${y}-${m}-${d} ${k}: ours ${hm(p[k], c.tz)} vs ${t[api]} (${method})`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}
for (const [k, v] of Object.entries(diffs)) console.log(k.padEnd(8), 'n', v.length, 'avg', (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2), 'max', Math.max(...v));
console.log('gaps over 2 min:', worst.length); worst.slice(0, 30).forEach((w) => console.log(' ', w));
