// Soft "clay" 3D icons for the story onboarding. Hand-drawn SVG with gradients and a contact shadow, so there is no
// image to download and they follow the same palette as the app. `name` picks the icon; decorative (aria-hidden).
import { useId } from 'react';

const ORANGE = ['#ffb184', '#ff6a2b', '#d23f00'];
const CREAM = ['#ffffff', '#ffe9da', '#f2c4a6'];
const CHAR = ['#6a707a', '#3a3e45', '#1c1e22'];

const Grad = ({ id, stops, x2 = 0, y2 = 1, radial = false }) => {
  const Tag = radial ? 'radialGradient' : 'linearGradient';
  const props = radial ? { cx: '35%', cy: '30%', r: '85%' } : { x1: 0, y1: 0, x2, y2 };
  return (
    <Tag id={id} {...props}>
      {stops.map((color, i) => <stop key={color} offset={`${(i / (stops.length - 1)) * 100}%`} stopColor={color} />)}
    </Tag>
  );
};

const SHAPES = {
  // two plates on a bar, tilted
  dumbbell: (f) => (
    <g transform="rotate(-24 80 78)">
      <rect x="40" y="70" width="80" height="16" rx="8" fill={f.char} />
      <rect x="40" y="70" width="80" height="6" rx="3" fill="#fff" opacity=".18" />
      {[[26, 44], [112, 44]].map(([x, y]) => <rect key={x} x={x} y={y} width="22" height="68" rx="9" fill={f.orange} />)}
      {[[18, 56], [128, 56]].map(([x, y]) => <rect key={x} x={x} y={y} width="14" height="44" rx="6" fill={f.orangeDark} />)}
      {[[29, 50], [115, 50]].map(([x, y]) => <rect key={x} x={x} y={y} width="5" height="50" rx="2.5" fill="#fff" opacity=".35" />)}
    </g>
  ),
  // medal with a star and ribbon
  medal: (f) => (
    <g>
      <path d="M52 18 L80 64 L68 70 L40 24 Z" fill={f.char} />
      <path d="M108 18 L80 64 L92 70 L120 24 Z" fill={f.orangeDark} />
      <circle cx="80" cy="92" r="46" fill={f.orange} />
      <circle cx="80" cy="92" r="34" fill={f.cream} />
      <path d="M80 70 l6.8 14.2 15.6 2.1 -11.4 10.8 2.9 15.4 -13.9 -7.5 -13.9 7.5 2.9 -15.4 -11.4 -10.8 15.6 -2.1 Z" fill={f.orange} />
      <ellipse cx="62" cy="68" rx="14" ry="7" fill="#fff" opacity=".4" transform="rotate(-35 62 68)" />
    </g>
  ),
  // clipboard with a checked list
  clipboard: (f) => (
    <g>
      <rect x="32" y="26" width="96" height="116" rx="16" fill={f.char} />
      <rect x="40" y="38" width="80" height="96" rx="9" fill={f.cream} />
      <rect x="56" y="16" width="48" height="26" rx="10" fill={f.orange} />
      <rect x="68" y="22" width="24" height="7" rx="3.5" fill={f.orangeDark} />
      {[58, 80, 102].map((y, i) => (
        <g key={y}>
          <rect x="50" y={y} width="16" height="16" rx="5" fill={i < 2 ? f.orange : '#e5cdbd'} />
          {i < 2 && <path d={`M54 ${y + 8} l4 4 l6 -8`} stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          <rect x="74" y={y + 3} width={i === 1 ? 34 : 40} height="9" rx="4.5" fill="#d9bfae" />
        </g>
      ))}
    </g>
  ),
  // stopwatch
  timer: (f) => (
    <g>
      <rect x="68" y="12" width="24" height="14" rx="5" fill={f.char} />
      <rect x="112" y="30" width="14" height="22" rx="6" fill={f.char} transform="rotate(40 119 41)" />
      <circle cx="80" cy="88" r="56" fill={f.orange} />
      <circle cx="80" cy="88" r="44" fill={f.cream} />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="78.5" y="48" width="3" height={i % 3 === 0 ? 9 : 5} rx="1.5" fill="#cda994" transform={`rotate(${i * 30} 80 88)`} />
      ))}
      <path d="M80 88 L80 62" stroke={f.char} strokeWidth="6" strokeLinecap="round" />
      <path d="M80 88 L98 98" stroke={f.orangeDark} strokeWidth="6" strokeLinecap="round" />
      <circle cx="80" cy="88" r="7" fill={f.char} />
      <ellipse cx="54" cy="58" rx="16" ry="7" fill="#fff" opacity=".35" transform="rotate(-40 54 58)" />
    </g>
  ),
  // flame
  flame: (f) => (
    <g>
      <path d="M82 8 C90 34 128 52 124 98 C121 130 100 148 80 148 C58 148 36 130 36 100 C36 78 50 66 58 52 C62 66 70 72 76 70 C70 50 74 28 82 8 Z" fill={f.orange} />
      <path d="M80 70 C86 88 108 98 104 120 C102 136 92 144 80 144 C66 144 56 134 56 120 C56 106 70 100 72 86 C76 92 78 92 80 70 Z" fill="#ffc98e" />
      <path d="M80 104 C84 114 94 118 92 130 C91 138 86 142 80 142 C73 142 69 137 69 130 C69 120 79 118 80 104 Z" fill={f.cream} />
      <ellipse cx="54" cy="96" rx="5" ry="16" fill="#fff" opacity=".3" transform="rotate(14 54 96)" />
    </g>
  ),
  // speech bubbles
  chat: (f) => (
    <g>
      <path d="M26 30 h84 a16 16 0 0 1 16 16 v40 a16 16 0 0 1 -16 16 H70 l-24 22 v-22 H26 a16 16 0 0 1 -16 -16 V46 a16 16 0 0 1 16 -16 Z" fill={f.orange} transform="translate(8 -4)" />
      {[44, 66, 88].map((x) => <circle key={x} cx={x + 8} cy="66" r="7" fill="#fff" />)}
      <path d="M96 100 h40 a14 14 0 0 1 14 14 v20 a14 14 0 0 1 -14 14 h-6 v16 l-18 -16 h-16 a14 14 0 0 1 -14 -14 v-20 a14 14 0 0 1 14 -14 Z" fill={f.char} opacity=".92" transform="translate(-8 -6)" />
      <rect x="92" y="112" width="34" height="7" rx="3.5" fill="#fff" opacity=".7" />
      <rect x="92" y="126" width="22" height="7" rx="3.5" fill="#fff" opacity=".45" />
    </g>
  ),
  // coins
  coin: (f) => (
    <g>
      {[[80, 108], [80, 86], [80, 64]].map(([cx, cy], i) => (
        <g key={cy}>
          <ellipse cx={cx} cy={cy + 12} rx="46" ry="16" fill={f.orangeDark} />
          <rect x={cx - 46} y={cy - 2} width="92" height="14" fill={f.orangeDark} />
          <ellipse cx={cx} cy={cy - 2} rx="46" ry="16" fill={i === 2 ? f.cream : f.orange} />
          {i === 2 && <ellipse cx={cx} cy={cy - 2} rx="34" ry="11" fill={f.orange} />}
        </g>
      ))}
      <path d="M80 50 v12 M74 54 q6 -4 12 0 M74 62 q6 4 12 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".0" />
    </g>
  ),
};

export default function Icon3D({ name, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const f = { orange: `url(#o${uid})`, orangeDark: `url(#d${uid})`, cream: `url(#c${uid})`, char: `url(#k${uid})` };
  return (
    <svg className={`icon3d ${className}`} viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <defs>
        <Grad id={`o${uid}`} stops={ORANGE} x2={0.5} y2={1} />
        <Grad id={`d${uid}`} stops={[ORANGE[1], ORANGE[2]]} />
        <Grad id={`c${uid}`} stops={CREAM} x2={0.4} y2={1} />
        <Grad id={`k${uid}`} stops={CHAR} />
        <filter id={`b${uid}`} filterUnits="userSpaceOnUse" x="0" y="130" width="160" height="30"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <ellipse cx="80" cy="152" rx="46" ry="7" fill="#000" opacity=".22" filter={`url(#b${uid})`} />
      {SHAPES[name](f)}
    </svg>
  );
}
