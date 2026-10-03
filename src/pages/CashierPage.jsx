import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Plus, Search, Square, Trash2, X } from 'lucide-react';
import { getProductByBarcode, searchProductsQuick } from '../api/products.api';
import { cancelSale, completeSale, createSale, listMySales, updateSaleItems } from '../api/sales.api';
import { endShift, getCurrentShift, startShift } from '../api/shifts.api';
import { useAuth } from '../auth/AuthContext';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { Button } from '../components/Button';
import { PAYMENT_METHODS } from '../data/paymentMethods';
import { roundQuantity, stepFor } from '../data/units';

// Bolds the substring of `name` that matched `query`, for the search dropdown.
function highlightMatch(name, query) {
  const idx = name.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span className="font-semibold text-primary">{name.slice(idx, idx + query.length)}</span>
      {name.slice(idx + query.length)}
    </>
  );
}

export function CashierPage() {
  const { user } = useAuth();
  const isCashier = user?.role === 'cashier';

  // Owners aren't shift-tracked (see server's Shift model) — only cashiers
  // must start a shift before the till works.
  const [shift, setShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(isCashier);
  const [shiftStarting, setShiftStarting] = useState(false);

  useEffect(() => {
    if (!isCashier) return;
    getCurrentShift()
      .then((data) => setShift(data.shift))
      .finally(() => setShiftLoading(false));
  }, [isCashier]);

  async function handleStartShift() {
    setShiftStarting(true);
    try {
      const { shift: newShift } = await startShift();
      setShift(newShift);
    } finally {
      setShiftStarting(false);
    }
  }

  async function handleEndShift() {
    await endShift();
    setShift(null);
  }

  const [tickets, setTickets] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [scanError, setScanError] = useState('');
  const [completing, setCompleting] = useState(false);
  // Keyed by ticket id so switching tabs never leaks one ticket's selected
  // payment method onto another.
  const [paymentMethods, setPaymentMethods] = useState({});
  // In-progress edits to a line's quantity field, keyed by productId — lets
  // a cashier type "30" once for a bulk item instead of tapping "+" 30 times.
  const [qtyDrafts, setQtyDrafts] = useState({});

  useEffect(() => {
    listMySales().then((data) => {
      setTickets(data.sales);
      setActiveId(data.sales[0]?._id || null);
    });
  }, []);

  const activeTicket = useMemo(() => tickets.find((t) => t._id === activeId), [tickets, activeId]);

  // Cart edits (scan, +/-, remove) must never overlap for the same ticket —
  // a fast scanner can fire the next mutation before the previous network
  // round-trip finishes, and MongoDB's optimistic-concurrency versioning
  // correctly rejects overlapping writes to the same Sale document. Queue
  // mutations per ticket so they always run one at a time, in order, against
  // the latest known state.
  const ticketsRef = useRef([]);
  useEffect(() => {
    ticketsRef.current = tickets;
  }, [tickets]);
  const mutationQueueRef = useRef({});

  function enqueueMutation(ticketId, fn) {
    const prevChain = mutationQueueRef.current[ticketId] || Promise.resolve();
    const result = prevChain.then(fn, fn);
    mutationQueueRef.current[ticketId] = result.catch(() => {});
    return result;
  }

  async function applyItemsChange(ticketId, mutate) {
    return enqueueMutation(ticketId, async () => {
      const current = ticketsRef.current.find((t) => t._id === ticketId);
      const items = current.items.map((i) => ({ productId: i.product, quantity: i.quantity }));
      mutate(items);
      const filtered = items.filter((i) => i.quantity > 0);
      const { sale } = await updateSaleItems(ticketId, filtered);
      ticketsRef.current = ticketsRef.current.map((t) => (t._id === sale._id ? sale : t));
      setTickets((prev) => prev.map((t) => (t._id === sale._id ? sale : t)));
      return sale;
    });
  }

  async function handleNewTicket() {
    const { sale } = await createSale();
    ticketsRef.current = [...ticketsRef.current, sale];
    setTickets((prev) => [...prev, sale]);
    setActiveId(sale._id);
    return sale;
  }

  // Shared by a barcode scan and a search-dropdown click — both just need to
  // add one unit of an already-resolved product to the active ticket.
  async function addProductToCart(product) {
    const ticket = activeTicket || (await handleNewTicket());
    try {
      await applyItemsChange(ticket._id, (items) => {
        const existing = items.find((i) => i.productId === product._id);
        if (existing) {
          existing.quantity += 1;
        } else {
          items.push({ productId: product._id, quantity: 1 });
        }
      });
    } catch (err) {
      setScanError(err.message);
    }
  }

  async function handleScan(barcode) {
    setScanError('');
    setManualBarcode('');
    setSuggestions([]);
    setShowSuggestions(false);

    let product;
    try {
      ({ product } = await getProductByBarcode(barcode));
    } catch (err) {
      setScanError(`"${barcode}" topilmadi`);
      return;
    }

    await addProductToCart(product);
  }

  useBarcodeScanner(handleScan);

  // Debounced name search as the cashier types — lets them find a product
  // without knowing its barcode. Skipped once a suggestion was just picked
  // (manualBarcode is cleared then) so the dropdown doesn't immediately
  // reopen on an empty query.
  useEffect(() => {
    const query = manualBarcode.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      searchProductsQuick(query)
        .then(({ products }) => {
          setSuggestions(products);
          setHighlightIndex(-1);
        })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [manualBarcode]);

  async function selectSuggestion(product) {
    setScanError('');
    setManualBarcode('');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightIndex(-1);
    await addProductToCart(product);
  }

  function handleSearchKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightIndex(-1);
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (showSuggestions && highlightIndex >= 0 && suggestions[highlightIndex]) {
      await selectSuggestion(suggestions[highlightIndex]);
      return;
    }
    if (!manualBarcode.trim()) return;
    await handleScan(manualBarcode.trim());
  }

  async function changeQuantity(productId, delta, unit) {
    setScanError('');
    try {
      await applyItemsChange(activeTicket._id, (items) => {
        const line = items.find((i) => i.productId === productId);
        line.quantity = roundQuantity(line.quantity + delta, unit);
      });
    } catch (err) {
      setScanError(err.message);
    }
  }

  async function commitQuantityDraft(productId, unit) {
    const draft = qtyDrafts[productId];
    setQtyDrafts((prev) => {
      const { [productId]: _omit, ...rest } = prev;
      return rest;
    });
    if (draft === undefined) return;
    // Uzbek/Russian keyboards use a comma as the decimal separator — accept
    // either when a cashier types a weight like "0,758".
    const value = Number(String(draft).replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) return;
    setScanError('');
    try {
      await applyItemsChange(activeTicket._id, (items) => {
        const line = items.find((i) => i.productId === productId);
        line.quantity = unit === 'kg' ? roundQuantity(value, unit) : Math.floor(value);
      });
    } catch (err) {
      setScanError(err.message);
    }
  }

  async function removeLine(productId) {
    setScanError('');
    try {
      await applyItemsChange(activeTicket._id, (items) => {
        const idx = items.findIndex((i) => i.productId === productId);
        if (idx >= 0) items.splice(idx, 1);
      });
    } catch (err) {
      setScanError(err.message);
    }
  }

  async function handleCancelTicket() {
    if (!activeTicket) return;
    await cancelSale(activeTicket._id);
    setTickets((prev) => prev.filter((t) => t._id !== activeTicket._id));
    setActiveId(null);
  }

  const selectedPayment = activeTicket ? paymentMethods[activeTicket._id] : null;

  function selectPaymentMethod(value) {
    if (!activeTicket) return;
    setPaymentMethods((prev) => ({ ...prev, [activeTicket._id]: value }));
  }

  async function handleComplete() {
    if (!activeTicket || activeTicket.items.length === 0 || !selectedPayment) return;
    setCompleting(true);
    try {
      await completeSale(activeTicket._id, selectedPayment);
      setTickets((prev) => prev.filter((t) => t._id !== activeTicket._id));
      setPaymentMethods((prev) => {
        const { [activeTicket._id]: _omit, ...rest } = prev;
        return rest;
      });
      await handleNewTicket();
    } catch (err) {
      setScanError(err.message);
    } finally {
      setCompleting(false);
    }
  }

  if (isCashier && shiftLoading) {
    return null;
  }

  if (isCashier && !shift) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 rounded-box border border-dashed border-base-300 text-center">
        <p className="text-base-content/60">Kassani ishlatishdan oldin ishni boshlang.</p>
        <Button onClick={handleStartShift} disabled={shiftStarting}>
          <Play size={16} className="mr-1.5 inline" />
          {shiftStarting ? 'Boshlanmoqda...' : 'Ishni boshlash'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Kassa</h1>
        {isCashier && (
          <button
            className="flex items-center gap-1.5 rounded-field px-3 py-1.5 text-sm text-base-content/50 hover:bg-error/10 hover:text-error"
            onClick={handleEndShift}
          >
            <Square size={14} /> Ishni tugatish
          </button>
        )}
      </div>

      {/* Ticket tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tickets.map((t, idx) => (
          <button
            key={t._id}
            onClick={() => setActiveId(t._id)}
            className={`animate-pop rounded-field px-3 py-1.5 text-sm font-medium transition-all ${
              t._id === activeId
                ? 'text-primary-content shadow-[0_6px_16px_-6px_hsl(var(--primary-h)_var(--primary-s)_45%/0.55)]'
                : 'bg-base-100 text-base-content/70 hover:bg-base-300 border border-base-300'
            }`}
            style={t._id === activeId ? { backgroundImage: 'var(--gradient-brand)' } : undefined}
          >
            Savdo {idx + 1}
            {t.items.length > 0 && <span className="ml-1 opacity-70">({t.items.length})</span>}
          </button>
        ))}
        <button
          onClick={handleNewTicket}
          className="flex items-center gap-1 rounded-field border border-dashed border-base-300 px-3 py-1.5 text-sm text-base-content/60 hover:bg-base-100"
        >
          <Plus size={16} /> Yangi savdo
        </button>
      </div>

      <form onSubmit={handleManualSubmit} className="mb-4 flex gap-2">
        <div className="relative w-full sm:w-72">
          <input
            className="input input-bordered w-full pr-8 font-mono"
            placeholder="Shtrix-kod yoki nomi bo'yicha qidiring..."
            value={manualBarcode}
            onChange={(e) => {
              setManualBarcode(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleSearchKeyDown}
            autoFocus
          />
          {manualBarcode && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setManualBarcode('');
                setSuggestions([]);
              }}
              aria-label="Tozalash"
            >
              <X size={16} />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-box border border-base-300 bg-base-100 py-1 shadow-xl">
              {suggestions.map((product, i) => (
                <li key={product._id}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                      i === highlightIndex ? 'bg-base-200' : 'hover:bg-base-200'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlightIndex(i)}
                    onClick={() => selectSuggestion(product)}
                  >
                    <Search size={14} className="shrink-0 text-base-content/40" />
                    <span className="flex-1 truncate">{highlightMatch(product.name, manualBarcode.trim())}</span>
                    <span className="shrink-0 text-base-content/50">
                      {product.price.toLocaleString()}
                      {product.unit === 'kg' ? '/kg' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" variant="secondary">
          Qo'shish
        </Button>
      </form>
      {scanError && <p className="mb-3 text-sm text-error">{scanError}</p>}

      {!activeTicket ? (
        <div className="flex flex-1 items-center justify-center rounded-box border border-dashed border-base-300 text-base-content/40">
          Savdoni boshlash uchun shtrix-kod skanerlang
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          <div className="flex-1 overflow-x-auto rounded-box border border-base-300 bg-base-100">
            <table className="table">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th>Narxi</th>
                  <th>Miqdor</th>
                  <th>Jami</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activeTicket.items.map((item, i) => (
                  <tr key={item.product} className="animate-fade-up" style={{ '--i': i }}>
                    <td className="font-medium">
                      {item.name}
                      {item.unit === 'kg' && <span className="ml-1 text-xs text-base-content/40">(kg)</span>}
                    </td>
                    <td>
                      {item.price.toLocaleString()}
                      {item.unit === 'kg' && <span className="text-base-content/40">/kg</span>}
                    </td>
                    <td>
                      <div className="join">
                        <button
                          className="btn btn-ghost btn-sm join-item"
                          onClick={() => changeQuantity(item.product, -stepFor(item.unit), item.unit)}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="input input-bordered input-sm join-item w-16 text-center"
                          value={qtyDrafts[item.product] ?? item.quantity}
                          onChange={(e) =>
                            setQtyDrafts((prev) => ({ ...prev, [item.product]: e.target.value }))
                          }
                          onBlur={() => commitQuantityDraft(item.product, item.unit)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.target.blur();
                            }
                          }}
                        />
                        <button
                          className="btn btn-ghost btn-sm join-item"
                          onClick={() => changeQuantity(item.product, stepFor(item.unit), item.unit)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="font-medium">{item.lineTotal.toLocaleString()}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm text-error" onClick={() => removeLine(item.product)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activeTicket.items.length === 0 && (
              <div className="py-10 text-center text-base-content/50">Hali mahsulot skanerlanmagan.</div>
            )}
          </div>

          <div className="w-full shrink-0 rounded-box border border-base-300 bg-base-100 p-5 lg:w-72">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base-content/60">Jami</span>
              <span
                key={activeTicket.total}
                className="animate-pop font-heading text-2xl font-semibold text-gradient-brand"
              >
                {activeTicket.total.toLocaleString()} so'm
              </span>
            </div>
            <div className="mb-3">
              <span className="mb-1.5 block text-xs text-base-content/50">To'lov turi</span>
              <div className="join w-full">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`btn btn-sm join-item flex-1 ${selectedPayment === m.value ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => selectPaymentMethod(m.value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <Button
              className="mb-2 w-full"
              onClick={handleComplete}
              disabled={completing || activeTicket.items.length === 0 || !selectedPayment}
            >
              {completing ? 'Yakunlanmoqda...' : 'Savdoni yakunlash'}
            </Button>
            <button
              className="flex w-full items-center justify-center gap-1 rounded-field py-2 text-sm text-base-content/50 hover:text-error"
              onClick={handleCancelTicket}
            >
              <X size={14} /> Savdoni bekor qilish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
