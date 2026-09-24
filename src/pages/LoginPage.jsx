import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTilt } from '../hooks/useTilt';
import { Button } from '../components/Button';
import logo from '../assets/logo.png';

const BARCODE_WIDTHS = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 1, 2, 1, 3, 2, 4, 1];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [marketSlug, setMarketSlug] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const tilt = useTilt();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(marketSlug, username, password);
      navigate(user.role === 'owner' ? '/overview' : '/cashier');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral text-neutral-content lg:flex-row">
      <div className="relative flex flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:w-1/2 lg:px-16 lg:py-12">
        <div className="brand-blob -left-20 -top-24 h-72 w-72" />
        <div className="brand-blob -bottom-28 right-0 h-80 w-80" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex items-center gap-2.5">
          <img src={logo} alt="KHAL.uz" className="h-9 w-9 shrink-0 rounded-field object-cover" />
          <span className="font-brand text-2xl text-gradient-brand">KHAL.uz</span>
        </div>

        <div className="relative z-10 my-12 max-w-sm lg:my-0">
          <div className="relative mb-7 flex h-14 items-end gap-[3px] overflow-hidden sm:h-16">
            {BARCODE_WIDTHS.map((w, i) => (
              <span
                key={i}
                className="animate-grow-y block rounded-[1px] bg-base-100/70"
                style={{ '--i': i, width: `${w * 2}px`, height: '100%' }}
              />
            ))}
            <div className="scan-line" />
          </div>

          <h2 className="font-heading text-2xl font-semibold leading-tight sm:text-3xl">
            Xoʻjalik mollari savdosi —{' '}
            <span className="text-gradient-brand">bir joyda, nazorat ostida</span>.
          </h2>
          <p className="mt-3 text-sm text-neutral-content/55">
            KHAL.uz doʻkonining kassa, ombor va savdolarini bitta panelda, real vaqtda boshqaring.
          </p>
        </div>

        <p className="relative z-10 hidden text-xs text-neutral-content/30 lg:block">
          © {new Date().getFullYear()} KHAL.uz
        </p>
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-base-100 px-6 py-10 text-base-content sm:px-10">
        <form
          ref={tilt.ref}
          onMouseMove={tilt.onMouseMove}
          onMouseLeave={tilt.onMouseLeave}
          onSubmit={handleSubmit}
          className="tilt-card w-full max-w-sm animate-scale-in"
        >
          <h1 className="mb-1 font-heading text-2xl font-semibold">Xush kelibsiz</h1>
          <p className="mb-7 text-sm text-base-content/50">Boshqaruv paneliga kirish uchun maʼlumotlaringizni kiriting.</p>

          <label className="mb-3 block animate-fade-up" style={{ '--i': 1 }}>
            <span className="mb-1 block text-sm text-base-content/60">Do'kon kodi</span>
            <input
              className="input input-bordered w-full"
              value={marketSlug}
              onChange={(e) => setMarketSlug(e.target.value)}
              autoFocus
            />
          </label>

          <label className="mb-3 block animate-fade-up" style={{ '--i': 2 }}>
            <span className="mb-1 block text-sm text-base-content/60">Foydalanuvchi nomi</span>
            <input
              className="input input-bordered w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className="mb-4 block animate-fade-up" style={{ '--i': 3 }}>
            <span className="mb-1 block text-sm text-base-content/60">Parol</span>
            <input
              className="input input-bordered w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="mb-3 text-sm text-error">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Kirilmoqda...' : 'Kirish'}
          </Button>
        </form>
      </div>
    </div>
  );
}
