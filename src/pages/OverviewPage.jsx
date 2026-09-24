import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanBarcode, Package, Users, BarChart3, Wallet, Receipt, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { getSummary, getTopProducts } from '../api/analytics.api';
import { listProducts } from '../api/products.api';
import { getDailyBriefing } from '../api/ai.api';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { StatTile } from '../components/StatTile';
import { Badge } from '../components/Badge';
import { useTilt } from '../hooks/useTilt';
import { formatQuantity } from '../data/units';

const LOW_STOCK_THRESHOLD = 5;

const QUICK_LINKS = [
  { to: '/cashier', label: 'Kassa', icon: ScanBarcode },
  { to: '/products', label: 'Mahsulotlar', icon: Package },
  { to: '/workers', label: 'Xodimlar', icon: Users },
  { to: '/analytics', label: 'Tahlillar', icon: BarChart3 },
];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatMoney(n) {
  return `${n.toLocaleString()} so'm`;
}

function DailyBriefing() {
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getDailyBriefing()
      .then((data) => setText(data.text))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  // A missing/failed briefing shouldn't break the rest of the dashboard.
  if (failed) return null;

  return (
    <div className="glow-primary mb-6 flex animate-fade-up items-start gap-4 rounded-box border border-base-300 bg-base-100 p-5">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field text-primary-content"
        style={{ backgroundImage: 'var(--gradient-brand)' }}
      >
        <Sparkles size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="mb-1.5 font-heading text-sm font-semibold text-base-content/80">Bugungi AI hisobot</h2>
        {loading ? (
          <div className="flex flex-col gap-2 py-1">
            <div className="skeleton-shimmer h-3.5 w-full rounded" />
            <div className="skeleton-shimmer h-3.5 w-4/5 rounded" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-base-content/70">{text}</p>
        )}
      </div>
    </div>
  );
}

export function OverviewPage() {
  const { user } = useAuth();
  const isPro = user?.market?.plan === 'pro';
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = { from: startOfToday() };
    setLoading(true);
    Promise.all([
      getSummary(params),
      getTopProducts({ ...params, limit: 5 }),
      listProducts({ maxStock: LOW_STOCK_THRESHOLD, limit: 6 }),
    ])
      .then(([s, t, p]) => {
        setSummary(s);
        setTopProducts(t.products);
        setLowStock(p.products);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Bosh sahifa" subtitle={`Xush kelibsiz, ${user?.name || ''}`} />

      {isPro && <DailyBriefing />}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Bugungi daromad"
          value={summary?.totalRevenue}
          format={(n) => formatMoney(Math.round(n))}
          icon={Wallet}
          accent
        />
        <StatTile label="Bugungi savdolar" value={summary?.totalTransactions} icon={Receipt} />
        <StatTile
          label="O'rtacha chek"
          value={summary?.averageSale}
          format={(n) => formatMoney(Math.round(n))}
          icon={TrendingUp}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-box border border-base-300 bg-base-100 p-5">
          <h2 className="mb-4 font-heading text-base font-semibold">Kamayib qolgan mahsulotlar</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-base-content/50">
              {loading ? 'Yuklanmoqda...' : "Hozircha kamayib qolgan mahsulot yo'q."}
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {lowStock.map((p, i) => (
                <li
                  key={p._id}
                  className="flex animate-fade-up items-center justify-between text-sm"
                  style={{ '--i': i }}
                >
                  <span className="font-medium">{p.name}</span>
                  <Badge tone={p.stock === 0 ? 'danger' : 'warning'}>{formatQuantity(p.stock, p.unit)}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link to="/products" className="mt-4 flex items-center gap-1 text-sm text-primary hover:underline">
            Barcha mahsulotlar <ArrowRight size={14} />
          </Link>
        </div>

        <div className="rounded-box border border-base-300 bg-base-100 p-5">
          <h2 className="mb-4 font-heading text-base font-semibold">Kunning yetakchilari</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-base-content/50">
              {loading ? 'Yuklanmoqda...' : "Bugun hali savdo bo'lmagan."}
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {topProducts.map((p, i) => (
                <li
                  key={p._id}
                  className="flex animate-fade-up items-center justify-between text-sm"
                  style={{ '--i': i }}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-base-content/60">{formatQuantity(p.quantity, p.unit)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/analytics" className="mt-4 flex items-center gap-1 text-sm text-primary hover:underline">
            Batafsil tahlil <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {QUICK_LINKS.map(({ to, label, icon: Icon }, i) => (
          <TiltLink key={to} to={to} label={label} Icon={Icon} index={i} />
        ))}
      </div>
    </div>
  );
}

function TiltLink({ to, label, Icon, index }) {
  const tilt = useTilt();
  return (
    <Link
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      to={to}
      style={{ '--i': index }}
      className="tilt-card group flex animate-fade-up flex-col items-start gap-3 rounded-box border border-base-300 bg-base-100 p-5 transition-shadow hover:shadow-lg"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-field text-primary-content transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundImage: 'var(--gradient-brand)' }}
      >
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
