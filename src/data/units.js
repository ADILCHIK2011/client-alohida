export const UNIT_OPTIONS = [
  { value: 'dona', label: 'Donalik' },
  { value: 'kg', label: 'Kilolik (kg)' },
  { value: 'metr', label: 'Metrlik (metr)' },
];

// 'dona' is counted as whole pieces; 'kg' and 'metr' are sold by a
// continuous measure (weight/length) — price is per-unit, stock and sale
// quantities can be fractional (e.g. 0.758 kg, 2.5 metr).
const FRACTIONAL_UNITS = new Set(['kg', 'metr']);

export function isFractionalUnit(unit) {
  return FRACTIONAL_UNITS.has(unit);
}

export function normalizeUnit(value) {
  return UNIT_OPTIONS.some((o) => o.value === value) ? value : 'dona';
}

const UNIT_SUFFIX = { kg: '/kg', metr: '/metr' };

export function unitSuffix(unit) {
  return UNIT_SUFFIX[unit] || '';
}

// Cashier +/- stepper increment: whole pieces for 'dona', 0.1 steps for
// fractional units (weight/length is usually entered by typing the exact
// figure, not by tapping).
export function stepFor(unit) {
  return isFractionalUnit(unit) ? 0.1 : 1;
}

// Rounds to 1/1000 precision for fractional units so repeated +/- taps or
// typed input don't accumulate floating-point noise (e.g. 0.1 + 0.2).
export function roundQuantity(value, unit) {
  if (isFractionalUnit(unit)) return Math.max(0, Math.round(value * 1000) / 1000);
  return Math.max(0, Math.round(value));
}

export function formatQuantity(value, unit) {
  const n = Number(value) || 0;
  if (isFractionalUnit(unit)) {
    return `${n.toLocaleString('uz-UZ', { maximumFractionDigits: 3 })} ${unit}`;
  }
  return `${n.toLocaleString()} dona`;
}
