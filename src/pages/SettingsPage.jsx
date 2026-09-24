import { useEffect, useState } from 'react';
import { changePassword } from '../api/auth.api';
import { getTelegramStatus, disconnectTelegram } from '../api/telegram.api';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { PricingCard } from '../components/PricingCard';
import { PLAN_PRICES, PLAN_FEATURES } from '../data/plans';
import { useAuth } from '../auth/AuthContext';

function TelegramCard() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isPro = user?.market?.plan === 'pro';

  useEffect(() => {
    if (!isPro) return;
    getTelegramStatus()
      .then(setStatus)
      .catch(() => setStatus({ connected: false, botUsername: null }));
  }, [isPro]);

  if (!isPro) {
    return (
      <div className="mt-6 max-w-sm">
        <PricingCard
          title="Pro"
          price={PLAN_PRICES.pro}
          features={PLAN_FEATURES.pro}
          highlight
          actionLabel="Pro rejaga o'tish uchun administratorga murojaat qiling"
          disabled
        />
      </div>
    );
  }

  async function handleDisconnect() {
    setError('');
    setBusy(true);
    try {
      await disconnectTelegram();
      setStatus((s) => ({ ...s, connected: false }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 max-w-sm rounded-box border border-base-300 bg-base-100 p-6">
      <h2 className="mb-1 font-heading text-base font-semibold">Telegram bot</h2>
      <p className="mb-4 text-sm text-base-content/50">
        Kunlik hisobot va bildirishnomalarni Telegram orqali oling
      </p>

      {status === null && <p className="text-sm text-base-content/50">Yuklanmoqda...</p>}

      {status?.connected === true && (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm text-success">
            <span className="h-2 w-2 rounded-full bg-success" /> Ulangan
          </p>
          <Button variant="danger" onClick={handleDisconnect} disabled={busy}>
            {busy ? 'Uzilmoqda...' : 'Uzish'}
          </Button>
        </div>
      )}

      {status?.connected === false && status.botUsername && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-base-content/70">
            Botni oching, <code className="font-mono">/start</code> yuboring, so'ng do'kon kodi
            (slug), login va parolingizni so'ralganda yuboring.
          </p>
          <a
            href={`https://t.me/${status.botUsername}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            Telegramda ochish
          </a>
        </div>
      )}

      {status?.connected === false && !status.botUsername && (
        <p className="text-sm text-base-content/50">Bot bu serverda hali sozlanmagan.</p>
      )}

      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    const form = new FormData(e.target);
    const currentPassword = form.get('currentPassword');
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      setError("Yangi parollar mos emas");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Sozlamalar" subtitle="Hisob maʼlumotlari" />

      <div className="max-w-sm rounded-box border border-base-300 bg-base-100 p-6">
        <h2 className="mb-1 font-heading text-base font-semibold">Parolni almashtirish</h2>
        <p className="mb-4 text-sm text-base-content/50">{user?.name} sifatida tizimga kirgansiz</p>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-base-content/60">Joriy parol</span>
            <input className="input input-bordered w-full" name="currentPassword" type="password" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-base-content/60">Yangi parol</span>
            <input className="input input-bordered w-full" name="newPassword" type="password" required minLength={4} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-base-content/60">Yangi parolni tasdiqlang</span>
            <input className="input input-bordered w-full" name="confirmPassword" type="password" required minLength={4} />
          </label>

          {error && <p className="text-sm text-error">{error}</p>}
          {success && <p className="text-sm text-success">Parol muvaffaqiyatli yangilandi</p>}

          <Button type="submit" disabled={submitting} className="mt-1">
            {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </form>
      </div>

      {user?.role === 'owner' && <TelegramCard />}
    </div>
  );
}
