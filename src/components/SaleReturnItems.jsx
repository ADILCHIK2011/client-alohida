import { useState } from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { returnSaleItems } from '../api/sales.api';
import { formatQuantity, isFractionalUnit } from '../data/units';

export function SaleReturnItems({ sale, onUpdated }) {
  const [qtyByIndex, setQtyByIndex] = useState({});
  const [busyIndex, setBusyIndex] = useState(null);
  const [error, setError] = useState('');

  async function handleReturn(index, remaining) {
    setError('');
    const raw = qtyByIndex[index];
    const quantity = raw === undefined || raw === '' ? remaining : Number(raw);
    if (!quantity || quantity <= 0 || quantity > remaining) {
      setError("Noto'g'ri qaytarish miqdori");
      return;
    }
    setBusyIndex(index);
    try {
      const data = await returnSaleItems(sale._id, [{ itemIndex: index, quantity }]);
      setQtyByIndex((prev) => ({ ...prev, [index]: '' }));
      onUpdated(data.sale);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyIndex(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {sale.items.map((item, i) => {
        const returned = item.returnedQuantity || 0;
        const remaining = item.quantity - returned;
        return (
          <div key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-base-300 pb-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span>
                  {item.name} x{formatQuantity(item.quantity, item.unit)}
                </span>
                {returned > 0 && (
                  <Badge tone="warning">{formatQuantity(returned, item.unit)} qaytarilgan</Badge>
                )}
              </div>
            </div>
            <span className="whitespace-nowrap">{item.lineTotal.toLocaleString()}</span>
            {remaining > 0 && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  className="input input-bordered input-xs w-16"
                  min={isFractionalUnit(item.unit) ? '0.001' : '1'}
                  step={isFractionalUnit(item.unit) ? '0.001' : '1'}
                  max={remaining}
                  placeholder={String(remaining)}
                  value={qtyByIndex[i] ?? ''}
                  onChange={(e) => setQtyByIndex((prev) => ({ ...prev, [i]: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="danger"
                  className="btn-xs"
                  disabled={busyIndex === i}
                  onClick={() => handleReturn(i, remaining)}
                >
                  Qaytarish
                </Button>
              </div>
            )}
          </div>
        );
      })}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
