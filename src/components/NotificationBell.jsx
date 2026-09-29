import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, X } from 'lucide-react';
import { listProducts } from '../api/products.api';
import { getSocket } from '../socket';
import { formatQuantity } from '../data/units';

const LOW_STOCK_THRESHOLD = 5;
const TOAST_DISMISS_MS = 6000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [toasts, setToasts] = useState([]);
  const containerRef = useRef(null);
  // Tracks which products are already known to be low, so a toast only
  // fires the moment a product *newly* crosses the threshold — not on every
  // subsequent sale that keeps it low.
  const alertedRef = useRef(new Set());
  const toastIdRef = useRef(0);
  // Mirrors `products` so the socket handler can look up a product's unit
  // (dona/kg) for the toast text — `stock:changed` diffs don't carry unit.
  const productsRef = useRef(new Map());

  useEffect(() => {
    productsRef.current = new Map(products.map((p) => [p._id, p]));
  }, [products]);

  function pushToast(text, tone = 'warning') {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DISMISS_MS);
  }

  useEffect(() => {
    listProducts().then((data) => {
      setProducts(data.products);
      alertedRef.current = new Set(
        data.products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).map((p) => p._id)
      );
    });
  }, []);

  // Correctness fallback in case a socket event was missed (e.g. a brief
  // disconnect) — cheap, since it only runs when the panel is actually opened.
  useEffect(() => {
    if (open) listProducts().then((data) => setProducts(data.products));
  }, [open]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleStockChanged(diffs) {
      setProducts((prev) => {
        const byId = new Map(prev.map((p) => [p._id, p]));
        for (const diff of diffs) {
          const existing = byId.get(diff.productId);
          byId.set(diff.productId, { ...existing, ...diff, _id: diff.productId });
        }
        return Array.from(byId.values());
      });

      for (const diff of diffs) {
        const isLow = diff.stock <= LOW_STOCK_THRESHOLD;
        const alreadyAlerted = alertedRef.current.has(diff.productId);
        if (isLow && !alreadyAlerted) {
          alertedRef.current.add(diff.productId);
          const unit = productsRef.current.get(diff.productId)?.unit;
          pushToast(
            `"${diff.name}" ${diff.stock === 0 ? 'tugadi' : `kam qoldi — ${formatQuantity(diff.stock, unit)} qoldi`}`,
            diff.stock === 0 ? 'danger' : 'warning'
          );
        } else if (!isLow && alreadyAlerted) {
          alertedRef.current.delete(diff.productId);
        }
      }
    }

    function handleProductRemoved({ productId }) {
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    }

    function handleBulkChanged() {
      listProducts().then((data) => setProducts(data.products));
    }

    socket.on('stock:changed', handleStockChanged);
    socket.on('product:removed', handleProductRemoved);
    socket.on('products:bulk-changed', handleBulkChanged);
    return () => {
      socket.off('stock:changed', handleStockChanged);
      socket.off('product:removed', handleProductRemoved);
      socket.off('products:bulk-changed', handleBulkChanged);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lowStock = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);
  const count = lowStock.length;

  return (
    <div ref={containerRef} className="relative">
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`glass animate-scale-in pointer-events-auto flex items-start gap-2 rounded-box border p-3 text-sm shadow-xl ${
              t.tone === 'danger' ? 'border-error/40' : 'border-warning/40'
            }`}
          >
            <AlertTriangle
              size={16}
              className={`mt-0.5 shrink-0 ${t.tone === 'danger' ? 'text-error' : 'text-warning'}`}
            />
            <span className="flex-1">{t.text}</span>
            <button
              className="shrink-0 text-base-content/40 hover:text-base-content"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              aria-label="Yopish"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        className="btn btn-ghost btn-sm btn-circle relative"
        onClick={() => setOpen((o) => !o)}
        aria-label="Bildirishnomalar"
      >
        <Bell size={18} />
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-primary-content"
            style={{ backgroundImage: 'var(--gradient-brand)' }}
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="glass animate-scale-in absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-box border border-base-300 p-3 shadow-xl">
          <h3 className="mb-2 px-1 font-heading text-sm font-semibold">Bildirishnomalar</h3>
          {count === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-base-content/50">Hozircha bildirishnoma yoʻq.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {lowStock.map((p) => (
                <Link
                  key={p._id}
                  to="/products"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2 rounded-field p-2 text-sm hover:bg-base-200"
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-error" />
                  <span>
                    <strong>{p.name}</strong> — {formatQuantity(p.stock, p.unit)} qoldi
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
