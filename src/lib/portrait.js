// A trainer who has not uploaded a photo gets a drawn portrait instead of a letter. It is made from the name alone,
// so the same name always gets the same face, and different names get different ones (skin, hair, clothes, colours).
// Nothing is fetched and nothing is stored.

const SKIN = ['#f3d2b3', '#e8b98f', '#d79c70', '#b97c52', '#8f5a3a'];
const HAIR = ['#17110d', '#2b1d14', '#4a3222', '#6a4a2c', '#8a8a8a'];
const BACKGROUND = ['#ffd8c2', '#ffe3a8', '#cde8d5', '#c9e2f5', '#d9d3f2', '#f6cfe0', '#d4ecea', '#f7dcc0'];
const SHIRT = ['#ff4d00', '#1f2937', '#2f6fed', '#10896f', '#8b5cf6', '#c2410c'];

export const HAIR_STYLES = ['short', 'long', 'bun', 'cap', 'beard'];

/** FNV-1a, then a mixing step per field so the choices do not move together. */
function hash(text) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}


export function portraitSpec(name) {
  const seed = hash(String(name ?? '').trim().normalize('NFC').toLowerCase());
  const at = (list, salt) => list[(Math.imul(seed ^ salt, 2654435761) >>> 0) % list.length];
  return {
    skin: at(SKIN, 0x9e37),
    hair: at(HAIR, 0x85eb),
    background: at(BACKGROUND, 0xc2b2),
    shirt: at(SHIRT, 0x27d4),
    style: at(HAIR_STYLES, 0x1656),
  };
}
