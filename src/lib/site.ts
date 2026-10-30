// Build-time helpers: city list, per-city facts across the year, nearby cities.
import CITIES from '../../scripts/cities.json';
import MOSQUES from '../data/mosques.json';
import { times, clock, todayIn, shortDate, defaultMethod, ramadan, span, daysIn, weekdayShort, hijriParts, PRAYERS, METHODS, methodAngles } from './salah.mjs';

export type City = (typeof CITIES)[number];
export const cities: City[] = [...CITIES].sort((a, b) => b.vol - a.vol);
export const bySlug = (s: string) => cities.find((c) => c.slug === s)!;
export const mosques = (c: City): { name: string; km: number; area: string; web: string }[] => (MOSQUES as any)[c.slug] ?? [];
export const cityUrl = (c: City) => `/prayer-times/${c.slug}/`;
export const label = (c: City) => (c.country === 'UK' ? `${c.name}, UK` : `${c.name}, ${c.region}`);
export const shortLabel = (c: City) => (c.slug === 'london-ontario' ? 'London, Ontario' : c.slug === 'washington-dc' ? 'Washington, DC' : c.slug === 'surrey' ? 'Surrey, BC' : c.name);
export const COUNTRIES = ['US', 'UK', 'Canada'] as const;
export const COUNTRY_NAME: Record<string, string> = { US: 'United States', UK: 'United Kingdom', Canada: 'Canada' };

export function dayRow(c: City, y: number, m: number, d: number) {
  const p = times(c.lat, c.lon, y, m, d, defaultMethod(c.country));
  const h = times(c.lat, c.lon, y, m, d, defaultMethod(c.country), true);
  return { p, hanafiAsr: h.asr, cells: Object.fromEntries(PRAYERS.map(([k]) => [k, clock((p as any)[k], c.tz)])) as Record<string, string> };
}

export function today(c: City) {
  const [y, m, d] = todayIn(c.tz);
  return { y, m, d, ...dayRow(c, y, m, d) };
}

export function monthRows(c: City) {
  const [y, m, D] = todayIn(c.tz);
  return { y, m, today: D, rows: Array.from({ length: daysIn(y, m) }, (_, i) => {
    const r = dayRow(c, y, m, i + 1), h = hijriParts(y, m, i + 1);
    return { d: i + 1, wd: weekdayShort(y, m, i + 1), hijri: `${h.day} ${h.month}`, ...r.cells };
  }) };
}

const minutes = (date: Date, tz: string) => { const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date).split(':').map(Number); return (p[0] % 24) * 60 + p[1]; };

/** Earliest/latest Fajr and Maghrib by the clock, and longest/shortest fast, across this calendar year. */
const yearCache = new Map<string, any>();
export function yearFacts(c: City) {
  if (yearCache.has(c.slug)) return yearCache.get(c.slug);
  const [Y] = todayIn(c.tz);
  const f: any = {};
  const keep = (key: string, val: number, higher: boolean, payload: any) => { if (!f[key] || (higher ? val > f[key].val : val < f[key].val)) f[key] = { val, ...payload }; };
  for (let t = Date.UTC(Y, 0, 1); t < Date.UTC(Y + 1, 0, 1); t += 864e5) {
    const x = new Date(t), m = x.getUTCMonth() + 1, d = x.getUTCDate();
    const p = times(c.lat, c.lon, Y, m, d, defaultMethod(c.country));
    const date = shortDate(Y, m, d);
    const fm = minutes(p.fajr, c.tz), mm = minutes(p.maghrib, c.tz), fast = (p.maghrib.getTime() - p.fajr.getTime()) / 60000;
    keep('earlyFajr', fm, false, { date, at: clock(p.fajr, c.tz) });
    keep('lateFajr', fm, true, { date, at: clock(p.fajr, c.tz) });
    keep('earlyMaghrib', mm, false, { date, at: clock(p.maghrib, c.tz) });
    keep('lateMaghrib', mm, true, { date, at: clock(p.maghrib, c.tz) });
    keep('longDay', fast, true, { date, at: span(p.fajr, p.maghrib) });
    keep('shortDay', fast, false, { date, at: span(p.fajr, p.maghrib) });
  }
  yearCache.set(c.slug, f);
  return f;
}

export const RAMADAN_2027 = ramadan(2027);
export function ramadanFacts(c: City) {
  const { first, last } = RAMADAN_2027;
  const m = defaultMethod(c.country);
  const a = times(c.lat, c.lon, first![0], first![1], first![2], m), b = times(c.lat, c.lon, last![0], last![1], last![2], m);
  return { firstDate: shortDate(first![0], first![1], first![2]), lastDate: shortDate(last![0], last![1], last![2]),
    sehriFirst: clock(a.fajr, c.tz), iftarFirst: clock(a.maghrib, c.tz), sehriLast: clock(b.fajr, c.tz), iftarLast: clock(b.maghrib, c.tz),
    fastFirst: span(a.fajr, a.maghrib), fastLast: span(b.fajr, b.maghrib) };
}

const dist = (a: City, b: City) => Math.hypot((a.lat - b.lat) * 111, (a.lon - b.lon) * 111 * Math.cos(a.lat * Math.PI / 180));
export const nearby = (c: City, n = 6) => cities.filter((o) => o.slug !== c.slug && o.country === c.country).sort((a, b) => dist(c, a) - dist(c, b)).slice(0, n);

export const methodText = (key: string) => {
  const a = methodAngles(key);
  const isha = a.ishaInterval ? `${a.ishaInterval} minutes after Maghrib` : `${a.isha}°`;
  return `${(METHODS as any)[key]}: Fajr ${a.fajr}°, Isha ${isha}`;
};
