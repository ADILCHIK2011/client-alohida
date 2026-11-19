export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Naqd' },
  { value: 'card', label: 'Terminal' },
  { value: 'online', label: "Onlayn" },
  // Has its own dedicated flow (picking a debtor) rather than being one of
  // the Kassa page's "to'lov turi" buttons — see CashierPage's nasiya
  // widget, which filters this value out of that button row.
  { value: 'nasiya', label: 'Nasiya' },
  // Not one of the Kassa page's "to'lov turi" buttons — it has its own
  // toggle+amount UI there (see CashierPage) — but needs a label here so
  // sales history can display it.
  { value: 'mixed', label: "Aralash" },
];

export function paymentMethodLabel(value) {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label || value;
}
