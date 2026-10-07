import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { createDebtor, deleteDebtor, getDebtor, listDebtors, recordPayment } from '../api/debtors.api';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { SaleReturnItems } from '../components/SaleReturnItems';

function formatMoney(n) {
  return `${(n || 0).toLocaleString()} so'm`;
}

function formatDate(value) {
  return new Date(value).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function NasiyaPage() {
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [openId, setOpenId] = useState(null);

  function reload() {
    setLoading(true);
    listDebtors(query)
      .then((data) => setDebtors(data.debtors))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timer = setTimeout(reload, 200);
    return () => clearTimeout(timer);
  }, [query]);

  async function handleAdd(e) {
    e.preventDefault();
    setAddError('');
    const form = new FormData(e.target);
    try {
      await createDebtor({
        name: form.get('name'),
        phone: form.get('phone'),
        note: form.get('note'),
      });
      setAdding(false);
      reload();
    } catch (err) {
      setAddError(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Nasiya"
        subtitle="Qarzga mahsulot olganlar"
        action={<Button onClick={() => setAdding(true)}>+ Yangi odam</Button>}
      />

      <div className="relative mb-5 w-full sm:w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
        <input
          className="input input-bordered w-full pl-9"
          placeholder="Ism bo'yicha qidirish..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!loading && debtors.length === 0 && (
        <div className="rounded-box border border-dashed border-base-300 py-10 text-center text-base-content/50">
          Hali nasiyachi qo'shilmagan.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {debtors.map((d, i) => (
          <button
            key={d._id}
            onClick={() => setOpenId(d._id)}
            className="animate-fade-up rounded-box border border-base-300 bg-base-100 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ '--i': i }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-medium">{d.name}</span>
              <Badge tone={d.balance > 0 ? 'warning' : 'neutral'}>{formatMoney(d.balance)}</Badge>
            </div>
            {d.phone && <div className="text-sm text-base-content/60">{d.phone}</div>}
            {d.note && <div className="mt-1 text-xs text-base-content/40">{d.note}</div>}
          </button>
        ))}
      </div>

      {adding && (
        <Modal title="Yangi nasiyachi" onClose={() => setAdding(false)}>
          <form className="flex flex-col gap-3" onSubmit={handleAdd}>
            <label className="block">
              <span className="mb-1 block text-sm text-base-content/60">Ism</span>
              <input className="input input-bordered w-full" name="name" required autoFocus />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-base-content/60">Telefon (ixtiyoriy)</span>
              <input className="input input-bordered w-full" name="phone" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-base-content/60">Izoh (ixtiyoriy)</span>
              <input className="input input-bordered w-full" name="note" />
            </label>
            {addError && <p className="text-sm text-error">{addError}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
                Bekor qilish
              </Button>
              <Button type="submit">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}

      {openId && (
        <DebtorDetail
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}

function DebtorDetail({ id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payError, setPayError] = useState('');
  const [paying, setPaying] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [expandedPurchase, setExpandedPurchase] = useState(null);

  function reload() {
    setLoading(true);
    getDebtor(id)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(reload, [id]);

  async function handleDelete() {
    setDeleteError('');
    if (!window.confirm("Bu nasiyachini o'chirishni tasdiqlaysizmi?")) return;
    setDeleting(true);
    try {
      await deleteDebtor(id);
      onChanged();
      onClose();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handlePay(e) {
    e.preventDefault();
    setPayError('');
    const form = new FormData(e.target);
    const amount = Number(form.get('amount'));
    setPaying(true);
    try {
      await recordPayment(id, { amount, note: form.get('note') });
      e.target.reset();
      reload();
      onChanged();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  }

  return (
    <Modal title={data?.debtor?.name || '...'} onClose={onClose}>
      {loading || !data ? (
        <div className="py-6 text-center text-base-content/50">Yuklanmoqda...</div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between rounded-field bg-base-200 px-4 py-3">
            <span className="text-sm text-base-content/60">Joriy qarz</span>
            <span className="font-heading text-lg font-semibold text-gradient-brand">
              {formatMoney(data.debtor.balance)}
            </span>
          </div>

          {data.debtor.balance > 0 && (
            <form className="flex flex-col gap-2" onSubmit={handlePay}>
              <span className="text-sm text-base-content/60">To'lov qabul qilish</span>
              <div className="flex gap-2">
                <input
                  className="input input-bordered w-32"
                  name="amount"
                  type="number"
                  min="1"
                  max={data.debtor.balance}
                  placeholder="Summa"
                  required
                />
                <input className="input input-bordered flex-1" name="note" placeholder="Izoh (ixtiyoriy)" />
                <Button type="submit" variant="secondary" disabled={paying}>
                  {paying ? '...' : "To'lash"}
                </Button>
              </div>
              {payError && <p className="text-sm text-error">{payError}</p>}
            </form>
          )}

          <div>
            <h3 className="mb-2 text-sm font-medium text-base-content/70">Xaridlar tarixi</h3>
            <div className="flex flex-col gap-2">
              {data.purchases.map((p) => (
                <div key={p._id} className="rounded-field border border-base-300 p-3 text-sm">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setExpandedPurchase((cur) => (cur === p._id ? null : p._id))}
                  >
                    <span className="text-base-content/50">{formatDate(p.completedAt)}</span>
                    <span className="font-medium">{formatMoney(p.total)}</span>
                  </button>
                  {expandedPurchase === p._id ? (
                    <div className="mt-2">
                      <SaleReturnItems
                        sale={p}
                        onUpdated={() => {
                          reload();
                          onChanged();
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-base-content/60">
                      {p.items.map((it) => it.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
              {data.purchases.length === 0 && (
                <div className="py-4 text-center text-sm text-base-content/40">Xaridlar yo'q</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-base-content/70">To'lovlar tarixi</h3>
            <div className="flex flex-col gap-2">
              {data.payments.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-field border border-base-300 p-3 text-sm">
                  <span className="text-base-content/50">{formatDate(p.createdAt)}</span>
                  <span className="font-medium text-success">{formatMoney(p.amount)}</span>
                </div>
              ))}
              {data.payments.length === 0 && (
                <div className="py-4 text-center text-sm text-base-content/40">To'lovlar yo'q</div>
              )}
            </div>
          </div>

          <div className="border-t border-base-300 pt-4">
            {deleteError && <p className="mb-2 text-sm text-error">{deleteError}</p>}
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? '...' : "Nasiyachini o'chirish"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
