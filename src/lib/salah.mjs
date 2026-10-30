// Prayer-time engine shared by the static build and the browser, so both always agree.
// Astronomy comes from the adhan library; this file adds method defaults, formatting and time-zone handling.
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, HighLatitudeRule, Qibla } from 'adhan';

export const METHODS = {
  NorthAmerica: 'ISNA (North America)',
  MoonsightingCommittee: 'Moonsighting Committee',
  MuslimWorldLeague: 'Muslim World League',
  Karachi: 'Karachi (Univ. of Islamic Sciences)',
  Egyptian: 'Egyptian General Authority',
  UmmAlQura: 'Umm al-Qura (Makkah)',
};
export const defaultMethod = (country) => (country === 'UK' ? 'MoonsightingCommittee' : 'NorthAmerica');

export const PRAYERS = [['fajr', 'Fajr'], ['sunrise', 'Sunrise'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha']];

export function times(lat, lon, y, m, d, method = 'NorthAmerica', hanafi = false) {
  const coords = new Coordinates(lat, lon);
  const params = CalculationMethod[method]();
  params.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.recommended(coords);
  // adhan reads the local calendar fields of this Date, so it works in any build or visitor time zone
  return new PrayerTimes(coords, new Date(y, m - 1, d), params);
}

export const methodAngles = (method) => {
  const p = CalculationMethod[method]();
  return { fajr: p.fajrAngle, isha: p.ishaAngle, ishaInterval: p.ishaInterval };
};

const clockCache = {};
const clockFmt = (tz) => (clockCache[tz] ??= new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }));
/** "5:47 AM" in the city's own time zone (daylight saving handled by the zone). */
export const clock = (date, tz) => clockFmt(tz).format(date);

/** Today's calendar date in a time zone, as [y, m, d]. */
export function todayIn(tz, now = new Date()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).split('-').map(Number);
  return [p[0], p[1], p[2]];
}

const UTC_NOON = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 12));
export const longDate = (y, m, d) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(UTC_NOON(y, m, d));
export const shortDate = (y, m, d) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(UTC_NOON(y, m, d));
export const monthName = (y, m) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(UTC_NOON(y, m, 1));
export const weekdayShort = (y, m, d) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(UTC_NOON(y, m, d));
export const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Hijri date from the Umm al-Qura calendar. Local moon sighting can differ by a day. */
const HIJRI = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
export function hijriParts(y, m, d) {
  const parts = HIJRI.formatToParts(UTC_NOON(y, m, d));
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: +get('day'), month: get('month'), year: parseInt(get('relatedYear') || get('year'), 10) };
}
export const hijriText = (y, m, d) => { const h = hijriParts(y, m, d); return `${h.day} ${h.month} ${h.year} AH`; };
const NUM = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { timeZone: 'UTC', month: 'numeric' });
export const hijriMonthNumber = (y, m, d) => parseInt(NUM.format(UTC_NOON(y, m, d)), 10);

/** Gregorian first and last day of Ramadan in a Gregorian year (calculated, Umm al-Qura). */
export function ramadan(year) {
  let first = null, last = null;
  for (let t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += 864e5) {
    const x = new Date(t), y = x.getUTCFullYear(), m = x.getUTCMonth() + 1, d = x.getUTCDate();
    if (hijriMonthNumber(y, m, d) === 9) { first ??= [y, m, d]; last = [y, m, d]; }
  }
  return { first, last };
}

const KAABA = [21.4225, 39.8262];
export const qiblaBearing = (lat, lon) => Qibla(new Coordinates(lat, lon));
export function kaabaKm(lat, lon) {
  const r = Math.PI / 180, a = Math.sin((KAABA[0] - lat) * r / 2) ** 2 + Math.cos(lat * r) * Math.cos(KAABA[0] * r) * Math.sin((KAABA[1] - lon) * r / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}
const POINTS = ['north', 'north-northeast', 'northeast', 'east-northeast', 'east', 'east-southeast', 'southeast', 'south-southeast', 'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest'];
export const compass = (deg) => POINTS[Math.round(deg / 22.5) % 16];

/** Minutes between two Dates as "13 hr 24 min". */
export const span = (a, b) => { const min = Math.round((b - a) / 60000); return `${Math.floor(min / 60)} hr ${min % 60} min`; };
