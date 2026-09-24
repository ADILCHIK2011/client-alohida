export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Naqd' },
  { value: 'card', label: 'Terminal' },
  { value: 'online', label: "Onlayn" },
];

export function paymentMethodLabel(value) {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label || value;
}
