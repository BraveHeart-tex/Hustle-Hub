export const darkenHexColor = (hex: string, factor: number = 0.2): string => {
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) {
    throw new Error('Invalid hex color format');
  }

  if (hex.length === 4) {
    hex = '#' + [...hex.slice(1)].map((c) => c + c).join('');
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const darken = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel * (1 - factor))));

  const dr = darken(r);
  const dg = darken(g);
  const db = darken(b);

  const toHex = (v: number) => v.toString(16).padStart(2, '0');

  return `#${toHex(dr)}${toHex(dg)}${toHex(db)}`;
};
