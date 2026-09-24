import { useEffect, useState } from 'react';
import { getDeadStock } from '../api/analytics.api';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { formatQuantity } from '../data/units';

const PRESETS = [
  { label: '7 kun', days: 7 },
  { label: '30 kun', days: 30 },
  { label: '60 kun', days: 60 },
  { label: '90 kun', days: 90 },
];
const PAGE_SIZE = 10;

export function DeadStockPage() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDeadStock({ days, page, limit: PAGE_SIZE })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [days, page]);

  return (
    <div>
      <PageHeader
        title="O'lik mahsulotlar"
        subtitle="Omborda turgan, lekin sotilmayotgan mahsulotlar"
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="join">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              className={`btn btn-sm join-item ${days === p.days ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setDays(p.days);
                setPage(1);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Shtrix-kod</th>
              <th>Nomi</th>
              <th>Qoldiq</th>
              <th>Oxirgi sotilgan</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const daysSince = p.lastSoldAt
                ? Math.floor((Date.now() - new Date(p.lastSoldAt)) / (1000 * 60 * 60 * 24))
                : null;
              const tone = !p.lastSoldAt || daysSince > days * 2 ? 'danger' : 'warning';
              return (
                <tr key={p._id} className="animate-fade-up" style={{ '--i': i }}>
                  <td className="font-mono text-sm text-base-content/70">{p.barcode}</td>
                  <td className="font-medium">{p.name}</td>
                  <td>{formatQuantity(p.stock, p.unit)}</td>
                  <td>
                    {p.lastSoldAt ? (
                      <Badge tone={tone}>{daysSince} kun oldin</Badge>
                    ) : (
                      <Badge tone={tone}>Hech qachon</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && products.length === 0 && (
          <div className="py-10 text-center text-base-content/50">
            Bu davrda sotilmagan mahsulot topilmadi.
          </div>
        )}
        <Pagination page={page} limit={PAGE_SIZE} total={total} onChange={setPage} />
      </div>
    </div>
  );
}
