import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { getAbcAnalysis } from '../api/analytics.api';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { formatQuantity } from '../data/units';

const RANGE_PRESETS = [
  { label: '7 kun', days: 7 },
  { label: '30 kun', days: 30 },
  { label: '90 kun', days: 90 },
];

const BUCKETS = [
  { key: null, label: 'Barchasi' },
  { key: 'A', label: 'A' },
  { key: 'B', label: 'B' },
  { key: 'C', label: 'C' },
];

const BUCKET_TONE = { A: 'warning', B: 'warning', C: 'danger' };
const PAGE_SIZE = 10;

function toInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseInputValue(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayInputValue() {
  return toInputValue(new Date());
}

function daysAgoInputValue(days) {
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  return toInputValue(d);
}

function startOfDayIso(dateStr) {
  const d = parseInputValue(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayIso(dateStr) {
  const d = parseInputValue(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
}

// Which tier a product belongs to, mirroring the server's ABC_BUCKETS so the
// "Barchasi" view (no bucket filter sent) can still badge each row correctly.
function bucketFor(daysSince) {
  if (daysSince === null || daysSince > 15) return 'C';
  if (daysSince >= 1 && daysSince <= 5) return 'A';
  if (daysSince > 5 && daysSince <= 15) return 'B';
  return null;
}

export function DeadStockPage() {
  const [presetDays, setPresetDays] = useState(30);
  const [customRange, setCustomRange] = useState(null); // { from, to } input-date strings, or null
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [bucket, setBucket] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const pickerRef = useRef(null);

  const activeRange = useMemo(() => {
    if (customRange) return customRange;
    return { from: daysAgoInputValue(presetDays), to: todayInputValue() };
  }, [customRange, presetDays]);

  useEffect(() => {
    setLoading(true);
    getAbcAnalysis({
      from: startOfDayIso(activeRange.from),
      to: endOfDayIso(activeRange.to),
      bucket: bucket || undefined,
      page,
      limit: PAGE_SIZE,
    })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [activeRange, bucket, page]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function openPicker() {
    setDraftFrom(customRange?.from || activeRange.from);
    setDraftTo(customRange?.to || activeRange.to);
    setPickerOpen(true);
  }

  const draftInvalid = !draftFrom || !draftTo || draftFrom > draftTo;

  function applyCustomRange() {
    if (draftInvalid) return;
    setCustomRange({ from: draftFrom, to: draftTo });
    setPage(1);
    setPickerOpen(false);
  }

  return (
    <div>
      <PageHeader title="ABC tahlil" subtitle="Mahsulotlarning oxirgi sotilgan vaqtiga ko'ra A/B/C toifalari" />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="join">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.days}
              className={`btn btn-sm join-item ${
                !customRange && presetDays === p.days ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() => {
                setCustomRange(null);
                setPresetDays(p.days);
                setPage(1);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div ref={pickerRef} className="relative">
          <button
            className={`btn btn-sm gap-2 ${customRange ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
          >
            <CalendarRange size={16} />
            {customRange
              ? `${formatDayLabel(customRange.from)} – ${formatDayLabel(customRange.to)}`
              : 'Oraliq tanlash'}
          </button>

          {pickerOpen && (
            <div className="glass animate-scale-in absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-box border border-base-300 p-4 shadow-xl">
              <div className="mb-3 flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-base-content/60">Boshlanish sanasi</span>
                  <input
                    type="date"
                    className="input input-sm input-bordered"
                    value={draftFrom}
                    max={draftTo || todayInputValue()}
                    onChange={(e) => setDraftFrom(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-base-content/60">Tugash sanasi</span>
                  <input
                    type="date"
                    className="input input-sm input-bordered"
                    value={draftTo}
                    min={draftFrom}
                    max={todayInputValue()}
                    onChange={(e) => setDraftTo(e.target.value)}
                  />
                </label>
              </div>
              {draftInvalid && draftFrom && draftTo && (
                <p className="mb-2 text-xs text-error">
                  Tugash sanasi boshlanish sanasidan oldin boʻlmasligi kerak.
                </p>
              )}
              <button className="btn btn-primary btn-sm w-full" disabled={draftInvalid} onClick={applyCustomRange}>
                Qoʻllash
              </button>
            </div>
          )}
        </div>

        <div className="join">
          {BUCKETS.map((b) => (
            <button
              key={b.label}
              className={`btn btn-sm join-item ${bucket === b.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setBucket(b.key);
                setPage(1);
              }}
            >
              {b.label}
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
              <th>Toifa</th>
              <th>Oxirgi sotilgan</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const tier = bucketFor(p.daysSince);
              return (
                <tr key={p._id} className="animate-fade-up" style={{ '--i': i }}>
                  <td className="font-mono text-sm text-base-content/70">{p.barcode}</td>
                  <td className="font-medium">{p.name}</td>
                  <td>{formatQuantity(p.stock, p.unit)}</td>
                  <td>{tier && <Badge tone={BUCKET_TONE[tier]}>{tier}</Badge>}</td>
                  <td>
                    {p.lastSoldAt ? (
                      <Badge tone={BUCKET_TONE[tier] || 'neutral'}>{p.daysSince} kun oldin</Badge>
                    ) : (
                      <Badge tone="danger">Hech qachon</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && products.length === 0 && (
          <div className="py-10 text-center text-base-content/50">Bu davrda mos mahsulot topilmadi.</div>
        )}
        <Pagination page={page} limit={PAGE_SIZE} total={total} onChange={setPage} />
      </div>
    </div>
  );
}
