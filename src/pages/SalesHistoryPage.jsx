import { useEffect, useState } from 'react';
import { getSalesHistory } from '../api/sales.api';
import { exportToXlsx } from '../api/exportXlsx';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { PAYMENT_METHODS, paymentMethodLabel } from '../data/paymentMethods';
import { formatQuantity } from '../data/units';

const PRESETS = [
  { label: '7 kun', days: 7 },
  { label: '30 kun', days: 30 },
  { label: '90 kun', days: 90 },
];
const PAGE_SIZE = 10;

const PAYMENT_BADGE_TONE = { cash: 'success', card: 'primary', online: 'neutral' };

function isoDaysAgo(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days + 1);
  return d.toISOString();
}

function formatMoney(n) {
  return `${n.toLocaleString()} so'm`;
}

export function SalesHistoryPage() {
  const { user } = useAuth();
  const isPro = user?.market?.plan === 'pro';
  const [exporting, setExporting] = useState(false);
  const [presetDays, setPresetDays] = useState(7);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSale, setOpenSale] = useState(null);

  useEffect(() => {
    setLoading(true);
    getSalesHistory({ from: isoDaysAgo(presetDays), paymentMethod: paymentFilter, page, limit: PAGE_SIZE })
      .then((data) => {
        setSales(data.sales);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [presetDays, paymentFilter, page]);

  async function handleExport() {
    setExporting(true);
    try {
      const EXPORT_PAGE_SIZE = 100;
      const from = isoDaysAgo(presetDays);
      let all = [];
      let pageNum = 1;
      let totalCount = Infinity;
      while (all.length < totalCount) {
        const data = await getSalesHistory({ from, paymentMethod: paymentFilter, page: pageNum, limit: EXPORT_PAGE_SIZE });
        all = all.concat(data.sales);
        totalCount = data.total;
        if (data.sales.length === 0) break;
        pageNum += 1;
      }
      await exportToXlsx({
        filename: 'savdolar-tarixi.xlsx',
        sheetName: 'Savdolar',
        columns: [
          { header: 'Sana', key: 'date', width: 20 },
          { header: 'Kassir', key: 'cashier', width: 16 },
          { header: "To'lov turi", key: 'payment', width: 14 },
          { header: 'Mahsulotlar tafsiloti', key: 'itemsDetail', width: 50 },
          { header: 'Mahsulotlar soni', key: 'itemCount', width: 14, format: 'number' },
          { header: 'Jami', key: 'total', width: 16, format: 'currency' },
        ],
        rows: all.map((s) => ({
          date: new Date(s.completedAt).toLocaleString('uz-UZ'),
          cashier: s.cashier?.name || '—',
          payment: paymentMethodLabel(s.paymentMethod),
          itemsDetail: s.items.map((it) => `${it.name} x${formatQuantity(it.quantity, it.unit)}`).join(', '),
          itemCount: s.items.length,
          total: s.total,
        })),
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Savdolar tarixi"
        subtitle="Yakunlangan savdolar roʻyxati"
        action={
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={!isPro || exporting}
            title={isPro ? undefined : "Excel'ga eksport Pro rejada mavjud"}
          >
            {exporting ? 'Eksport...' : `Excel'ga eksport${isPro ? '' : ' (Pro)'}`}
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="join">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              className={`btn btn-sm join-item ${presetDays === p.days ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setPresetDays(p.days);
                setPage(1);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="join">
          <button
            className={`btn btn-sm join-item ${paymentFilter === '' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setPaymentFilter('');
              setPage(1);
            }}
          >
            Barchasi
          </button>
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              className={`btn btn-sm join-item ${paymentFilter === m.value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setPaymentFilter(m.value);
                setPage(1);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Sana</th>
              <th>Kassir</th>
              <th>To'lov turi</th>
              <th>Mahsulotlar</th>
              <th>Jami</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s, i) => (
              <tr
                key={s._id}
                className="animate-fade-up cursor-pointer hover:bg-base-200"
                style={{ '--i': i }}
                onClick={() => setOpenSale(s)}
              >
                <td className="text-base-content/70">{new Date(s.completedAt).toLocaleString('uz-UZ')}</td>
                <td className="font-medium">{s.cashier?.name || '—'}</td>
                <td>
                  <Badge tone={PAYMENT_BADGE_TONE[s.paymentMethod] || 'neutral'}>
                    {paymentMethodLabel(s.paymentMethod)}
                  </Badge>
                </td>
                <td>{s.items.length} xil</td>
                <td className="font-medium">{formatMoney(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && sales.length === 0 && (
          <div className="py-10 text-center text-base-content/50">Bu davrda yakunlangan savdo yoʻq.</div>
        )}
        <Pagination page={page} limit={PAGE_SIZE} total={total} onChange={setPage} />
      </div>

      {openSale && (
        <Modal
          title={new Date(openSale.completedAt).toLocaleString('uz-UZ')}
          onClose={() => setOpenSale(null)}
        >
          <div className="flex flex-col gap-2 font-mono text-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-base-content/60">To'lov turi</span>
              <Badge tone={PAYMENT_BADGE_TONE[openSale.paymentMethod] || 'neutral'}>
                {paymentMethodLabel(openSale.paymentMethod)}
              </Badge>
            </div>
            {openSale.items.map((item) => (
              <div key={item.product} className="flex justify-between gap-2">
                <span className="flex-1">
                  {item.name} x{formatQuantity(item.quantity, item.unit)}
                </span>
                <span>{item.lineTotal.toLocaleString()}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-dashed border-base-300 pt-2 text-base font-semibold">
              <span>Jami</span>
              <span>{formatMoney(openSale.total)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
