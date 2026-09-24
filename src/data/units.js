export const UNIT_OPTIONS = [
  { value: 'dona', label: 'Donalik' },
  { value: 'kg', label: 'Kilolik (kg)' },
];

// Cashier +/- stepper increment: whole pieces for 'dona', 100g steps for 'kg'
// (weight is usually entered by typing the exact figure, not by tapping).
export function stepFor(unit) {
  return unit === 'kg' ? 0.1 : 1;
}

// Rounds to gram precision for 'kg' so repeated +/- taps or typed input
// don't accumulate floating-point noise (e.g. 0.1 + 0.2).
export function roundQuantity(value, unit) {
  if (unit === 'kg') return Math.max(0, Math.round(value * 1000) / 1000);
  return Math.max(0, Math.round(value));
}

export function formatQuantity(value, unit) {
  const n = Number(value) || 0;
  if (unit === 'kg') {
    return `${n.toLocaleString('uz-UZ', { maximumFractionDigits: 3 })} kg`;
  }
  return `${n.toLocaleString()} dona`;
}
