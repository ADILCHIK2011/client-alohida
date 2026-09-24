import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanBarcode,
  Barcode,
  Package,
  History,
  PackageX,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { NotificationBell } from '../components/NotificationBell';
import { Badge } from '../components/Badge';
import logo from '../assets/logo.png';

const OWNER_NAV = [
  { to: '/overview', label: 'Bosh sahifa', icon: LayoutDashboard },
  { to: '/ai', label: 'AI yordamchi', icon: Sparkles },
  { to: '/cashier', label: 'Kassa', icon: ScanBarcode },
  { to: '/products', label: 'Mahsulotlar', icon: Package },
  { to: '/barcode-generator', label: 'Shtrix-kod yaratish', icon: Barcode },
  { to: '/sales-history', label: 'Savdolar tarixi', icon: History },
  { to: '/dead-stock', label: "O'lik mahsulotlar", icon: PackageX },
  { to: '/workers', label: 'Xodimlar', icon: Users },
  { to: '/analytics', label: 'Tahlillar', icon: BarChart3 },
  { to: '/settings', label: 'Sozlamalar', icon: Settings },
];

const CASHIER_NAV = [{ to: '/cashier', label: 'Kassa', icon: ScanBarcode }];

export function DashboardShell() {
  const { user, logout } = useAuth();
  const nav = user?.role === 'owner' ? OWNER_NAV : CASHIER_NAV;
  const isPro = user?.market?.plan === 'pro';
  const { isDark, toggleTheme } = useTheme(isPro);
  const initial = user?.name?.[0]?.toUpperCase() || '?';
  const roleLabel = user?.role === 'owner' ? 'Boshliq' : 'Kassir';
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-base-200">
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-base-300 bg-base-100 py-5 transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-2.5 px-5">
          <div className="flex items-center gap-2.5">
            <img
              src={logo}
              alt="KHAL.uz"
              className="h-9 w-9 shrink-0 rounded-field object-cover shadow-[0_6px_16px_-4px_hsl(var(--primary-h)_var(--primary-s)_45%/0.6)] transition-transform duration-300 hover:-rotate-6 hover:scale-105"
            />
            <span className="font-brand text-2xl text-gradient-brand">KHAL.uz</span>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-circle lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Menyuni yopish"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {nav.map((item, i) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setNavOpen(false)}
                style={({ isActive }) => ({
                  '--i': i,
                  backgroundImage: isActive ? 'var(--gradient-brand)' : undefined,
                })}
                className={({ isActive }) =>
                  `flex animate-fade-up items-center gap-3 rounded-field px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-primary-content shadow-[0_6px_18px_-6px_hsl(var(--primary-h)_var(--primary-s)_45%/0.55)]'
                      : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      strokeWidth={2}
                      className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.to === '/ai' && !isPro && <Badge tone="primary">Pro</Badge>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto px-3">
          <button
            className="flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-sm font-medium text-base-content/60 transition-colors hover:bg-error/10 hover:text-error"
            onClick={logout}
          >
            <LogOut size={18} strokeWidth={2} />
            Chiqish
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex items-center gap-3 bg-base-100 px-4 py-3 sm:px-6">
          <button
            className="btn btn-ghost btn-sm btn-circle lg:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Menyuni ochish"
          >
            <Menu size={18} />
          </button>
          <div className="flex flex-1 items-center justify-end gap-3">
            {user?.role === 'owner' && <NotificationBell />}
            {isPro ? (
              <button
                className="btn btn-ghost btn-sm btn-circle transition-transform duration-200 hover:-rotate-12"
                onClick={toggleTheme}
                aria-label={isDark ? "Yorugʻ rejimga oʻtish" : "Qorongʻu rejimga oʻtish"}
                title={isDark ? "Yorugʻ rejimga oʻtish" : "Qorongʻu rejimga oʻtish"}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            ) : (
              <div
                className="hidden items-center gap-1.5 sm:flex"
                title="Qorongʻu rejim faqat Pro rejada mavjud"
              >
                <button className="btn btn-ghost btn-sm btn-circle" disabled>
                  <Moon size={18} className="opacity-40" />
                </button>
                <Badge tone="primary">Pro</Badge>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary ring-2 ring-primary/25"
                style={{ backgroundImage: 'var(--gradient-brand)', color: 'var(--color-primary-content)' }}
              >
                {initial}
              </div>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-base-content/50">{roleLabel}</div>
              </div>
            </div>
          </div>
          <div
            className="absolute inset-x-0 bottom-0 h-px opacity-60"
            style={{ backgroundImage: 'var(--gradient-brand)' }}
          />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
