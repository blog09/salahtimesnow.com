// Brand: logo mark, homepage illustration, colours. Inline SVG only (no requests).
export const NAME = ['Salah', 'TimesNow'];
export const COLORS = { bg: '#064e3b', hi: '#fbbf24', accent: '#047857' };
export const DOMAIN = 'salahtimesnow.com';
export const TAGLINE = ['Prayer times for your city today', 'Fajr to Isha, with monthly timetables and Qibla'];
const FONT = 'font-family="system-ui,Segoe UI,Arial,sans-serif"';

// A crescent with a star.
export const mark = (size = 34) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">
<rect width="40" height="40" rx="9" fill="#064e3b"/>
<path d="M25 7a13.5 13.5 0 1 0 0 26 11 11 0 0 1 0-26z" fill="#fbbf24"/>
<path d="M29 15l1.5 3.4 3.7.4-2.8 2.5.8 3.7-3.2-1.9-3.2 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="#fff"/></svg>`;

// Homepage: the sun's path through the day, with the prayer each position marks.
export const hero = () => {
  const P = [[30, 172, 'Fajr', '#6ee7b7'], [66, 142, 'Sunrise', '#fbbf24'], [180, 38, 'Dhuhr', '#f59e0b'], [272, 96, 'Asr', '#f59e0b'], [322, 172, 'Maghrib', '#fb923c']];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 232" role="img" aria-label="The sun's path through the day, with the five daily prayers marked">
<rect width="360" height="232" rx="14" fill="#ecfdf5"/>
<path d="M30 172Q180 -90 330 172" fill="none" stroke="#a7f3d0" stroke-width="3" stroke-dasharray="5 6"/>
<line x1="14" x2="346" y1="172" y2="172" stroke="#064e3b" stroke-width="2"/>
${P.map(([x, y, l, c]) => `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/><text x="${x}" y="${y - 14}" text-anchor="middle" ${FONT} font-size="12" font-weight="800" fill="#064e3b">${l}</text>`).join('')}
<circle cx="340" cy="202" r="6" fill="#064e3b"/><text x="330" y="206" text-anchor="end" ${FONT} font-size="12" font-weight="800" fill="#064e3b">Isha, after twilight ends</text>
</svg>`;
};
