// Content images for SalahTimesNow, rendered to PNG by sites/brand-assets/make_images.mjs.
import { tableImage, barChart, pin } from 'file:///C:/Users/mattd/Documents/Claude%20AI/sites/brand-assets/charts.mjs';
const G = '#047857', D = '#064e3b';
export default async function images() {
  const rak = tableImage(
    [{ head: 'Prayer', w: 260 }, { head: 'Fard rakats', w: 230, align: 'r' }, { head: 'Sunnah commonly prayed', w: 630 }],
    [['Fajr', '2', '2 before'], ['Dhuhr', '4', '2 or 4 before, 2 after'], ['Asr', '4', 'optional 4 before'], ['Maghrib', '3', '2 after'], ['Isha', '4', '2 after, then Witr (1 or 3)'], ['Total', '17', 'Sunnah counts vary by school']],
    { title: 'How many rakats in each prayer?', subtitle: '17 obligatory (fard) rakats a day; sunnah patterns differ between schools', color: G, headBg: '#d1fae5', zebra: '#ecfdf5', source: 'Fard counts agreed across the schools of Islamic law', brand: 'salahtimesnow.com', rowH: 56 });
  const ang = barChart([
    { label: 'Egyptian Authority', value: 19.5, text: 'Fajr 19.5°', color: D }, { label: 'Umm al-Qura', value: 18.5, text: 'Fajr 18.5°', color: D },
    { label: 'Muslim World League', value: 18, text: 'Fajr 18°', color: G }, { label: 'Karachi', value: 18, text: 'Fajr 18°', color: G },
    { label: 'Moonsighting Committee', value: 18, text: 'Fajr 18° (seasonal)', color: G }, { label: 'ISNA (North America)', value: 15, text: 'Fajr 15°', color: '#34d399' },
  ], { title: 'Why prayer apps show different Fajr times', subtitle: 'Sun angle below the horizon used for Fajr by each calculation method', source: 'A larger angle means an earlier Fajr, by up to about 30 minutes', brand: 'salahtimesnow.com', color: G, accent: D, padL: 330, max: 22 });
  return [
    { file: 'img/rakats-in-each-prayer.png', svg: rak, width: 1200 },
    { file: 'img/rakats-in-each-prayer-pin.png', svg: pin(rak, { title: 'Rakats in\neach prayer', color: D, domain: 'salahtimesnow.com' }), width: 1000 },
    { file: 'img/fajr-angle-by-method.png', svg: ang, width: 1200 },
  ];
}
