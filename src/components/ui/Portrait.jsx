// The drawn portrait for someone without a photo (see lib/portrait.js). Pure SVG, decorative.
import { portraitSpec } from '../../lib/portrait.js';

export default function Portrait({ name }) {
  const { skin, hair, background, shirt, style } = portraitSpec(name);
  const shade = 'rgba(0,0,0,0.14)';
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect width="100" height="100" fill={background} />
      <circle cx="50" cy="40" r="34" fill="rgba(255,255,255,0.35)" />
      {style === 'long' && <path d="M29 50C24 22 40 17 50 17s26 5 21 33l3 32H26z" fill={hair} />}
      <path d="M12 100c0-24 15-32 38-32s38 8 38 32z" fill={shirt} />
      <path d="M41 70c3 5 6 7 9 7s6-2 9-7l-3-9H44z" fill={skin} />
      <path d="M44 62h12v6c-4 3-8 3-12 0z" fill={shade} />
      <circle cx="34.5" cy="47" r="3.2" fill={skin} />
      <circle cx="65.5" cy="47" r="3.2" fill={skin} />
      <ellipse cx="50" cy="46" rx="16" ry="19" fill={skin} />
      {style === 'beard' && <path d="M34 50c0 16 7 22 16 22s16-6 16-22c-3 6-8 9-16 9s-13-3-16-9z" fill={hair} />}
      {(style === 'short' || style === 'beard' || style === 'bun') && <path d="M33.5 45C31 26 43 21 50 21s19 5 16.5 24c-3-8-9-12-16.5-12s-13.5 4-16.5 12z" fill={hair} />}
      {style === 'bun' && <circle cx="50" cy="18" r="7.5" fill={hair} />}
      {style === 'long' && <path d="M33 46C32 28 42 24 50 24s18 4 17 22c-5-7-10-10-17-10s-12 3-17 10z" fill={hair} />}
      {style === 'cap' && (
        <>
          <path d="M32.5 42C32 27 41 21 50 21s18 6 17.5 21z" fill={shirt} />
          <path d="M31 42h38c0 3-4 4-9 4H40c-5 0-9-1-9-4z" fill="rgba(0,0,0,0.22)" />
        </>
      )}
      <circle cx="43.5" cy="48" r="1.8" fill="#1f1a17" />
      <circle cx="56.5" cy="48" r="1.8" fill="#1f1a17" />
      <path d="M44.5 56.5c3.5 3 7.5 3 11 0" fill="none" stroke="#1f1a17" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}
