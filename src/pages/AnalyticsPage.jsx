import { useEffect, useMemo, useRef, useState } from 'react';
import { TrendingUp, Receipt, Wallet, CalendarRange } from 'lucide-react';
import { getDaily, getSummary, getTopProducts } from '../api/analytics.api';
import { PageHeader } from '../components/PageHeader';
import { StatTile } from '../components/StatTile';
import { formatQuantity } from '../data/units';

const PRESETS = [
  { label: '7 kun', days: 7 },
  { label: '30 kun', days: 30 },
  { label: '90 kun', days: 90 },
];

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

function formatMoney(n) {
  return `${n.toLocaleString()} so'm`;
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
}

function roundedTopRectPath(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height);
  if (height <= 0) return '';
  return `M${x + r},${y} h${width - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${height - r} h${-width} v${-(height - r)} a${r},${r} 0 0 1 ${r},${-r} z`;
}

function DailyRevenueChart({ days }) {
  const [hover, setHover] = useState(null);
  const width = 720;
  const height = 200;
  const padTop = 16;
  const padBottom = 28;
  const chartHeight = height - padTop - padBottom;
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const slot = width / Math.max(days.length, 1);
  const barWidth = Math.min(24, slot - 4);

  const ticks = [0, 0.5, 1].map((f) => Math.round((max * f) / 1000) * 1000 || Math.round(max * f));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 220 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary-h) 95% 58%)' }} />
            <stop offset="100%" style={{ stopColor: 'hsl(calc(var(--primary-h) - 12) 92% 42%)' }} />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => {
          const y = padTop + chartHeight - (t / max) * chartHeight;
          return (
            <g key={i}>
              <line x1={0} x2={width} y1={y} y2={y} stroke="currentColor" className="text-base-300" strokeWidth={1} />
              <text x={0} y={y - 4} fontSize={10} className="fill-base-content/40">
                {t.toLocaleString()}
              </text>
            </g>
          );
        })}
        {days.map((d, i) => {
          const barHeight = (d.revenue / max) * chartHeight;
          const x = i * slot + (slot - barWidth) / 2;
          const y = padTop + chartHeight - barHeight;
          return (
            <g
              key={d.date}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            >
              <rect x={x} y={padTop} width={barWidth} height={chartHeight} fill="transparent" />
              <path
                d={roundedTopRectPath(x, y, barWidth, barHeight, 4)}
                fill="url(#barGradient)"
                opacity={hover === null || hover === i ? 1 : 0.4}
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'bottom',
                  animation: 'grow-y 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
                  animationDelay: `${i * 25}ms`,
                }}
              />
              {(i === 0 || i === days.length - 1 || i === hover) && (
                <text x={x + barWidth / 2} y={height - 8} fontSize={10} textAnchor="middle" className="fill-base-content/50">
                  {formatDayLabel(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && days[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-field border border-base-300 bg-base-100 px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${((hover + 0.5) / days.length) * 100}%`, top: 0 }}
        >
          <div className="font-semibold">{formatMoney(days[hover].revenue)}</div>
          <div className="text-base-content/50">{formatDayLabel(days[hover].date)}</div>
        </div>
      )}
    </div>
  );
}

export function AnalyticsPage() {
  const [presetDays, setPresetDays] = useState(30);
  const [customRange, setCustomRange] = useState(null); // { from, to } input-date strings, or null
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [days, setDays] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const pickerRef = useRef(null);

  // The active window, expressed as input-date strings, regardless of whether
  // it came from a preset or the custom picker — everything downstream (the
  // request params and the chart's day-fill) reads from this one shape.
  const activeRange = useMemo(() => {
    if (customRange) return customRange;
    return { from: daysAgoInputValue(presetDays), to: todayInputValue() };
  }, [customRange, presetDays]);

  const params = useMemo(
    () => ({ from: startOfDayIso(activeRange.from), to: endOfDayIso(activeRange.to) }),
    [activeRange]
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([getSummary(params), getDaily(params), getTopProducts({ ...params, limit: 8 })])
      .then(([s, d, t]) => {
        setSummary(s);
        setTopProducts(t.products);

        // Fill in missing days with 0 so the chart isn't gappy
        const byDate = Object.fromEntries(d.days.map((row) => [row.date, row.revenue]));
        const filled = [];
        const cursor = parseInputValue(activeRange.from);
        const end = parseInputValue(activeRange.to);
        while (cursor <= end) {
          const key = toInputValue(cursor);
          filled.push({ date: key, revenue: byDate[key] || 0 });
          cursor.setDate(cursor.getDate() + 1);
        }
        setDays(filled);
      })
      .finally(() => setLoading(false));
  }, [params, activeRange]);

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
    setPickerOpen(false);
  }

  return (
    <div>
      <PageHeader title="Tahlillar" subtitle="Savdolar bo'yicha statistika" />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="join">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              className={`btn btn-sm join-item ${
                !customRange && presetDays === p.days ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() => {
                setCustomRange(null);
                setPresetDays(p.days);
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
              <button
                className="btn btn-primary btn-sm w-full"
                disabled={draftInvalid}
                onClick={applyCustomRange}
              >
                Qoʻllash
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Jami daromad"
          value={summary?.totalRevenue}
          format={(n) => formatMoney(Math.round(n))}
          icon={Wallet}
          accent
        />
        <StatTile label="Savdolar soni" value={summary?.totalTransactions} icon={Receipt} />
        <StatTile
          label="O'rtacha chek"
          value={summary?.averageSale}
          format={(n) => formatMoney(Math.round(n))}
          icon={TrendingUp}
        />
      </div>

      <div className="mb-6 rounded-box border border-base-300 bg-base-100 p-5">
        <h2 className="mb-4 font-heading text-base font-semibold">Kunlik daromad</h2>
        {!loading && days.length > 0 && <DailyRevenueChart days={days} />}
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Mahsulot</th>
              <th>Sotilgan miqdor</th>
              <th>Daromad</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p, i) => (
              <tr key={p._id} className="animate-fade-up" style={{ '--i': i }}>
                <td className="font-medium">{p.name}</td>
                <td>{formatQuantity(p.quantity, p.unit)}</td>
                <td>{formatMoney(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && topProducts.length === 0 && (
          <div className="py-10 text-center text-base-content/50">Bu davrda savdo bo'lmagan.</div>
        )}
      </div>
    </div>
  );
}
