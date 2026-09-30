import { useEffect, useState } from 'react';
import { createWorker, listWorkers, resetWorkerPassword, updateWorker } from '../api/workers.api';
import { getShiftHistory } from '../api/shifts.api';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';

const PERMISSION_OPTIONS = [
  { key: 'overview', label: 'Bosh sahifa' },
  { key: 'products', label: 'Mahsulotlar' },
  { key: 'sales-history', label: 'Savdolar tarixi' },
  { key: 'analytics', label: 'Tahlillar' },
  { key: 'dead-stock', label: "O'lik mahsulotlar" },
  { key: 'ai', label: 'AI yordamchi' },
];

const SHIFT_PAGE_SIZE = 10;

function formatShiftTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [resettingId, setResettingId] = useState(null);
  const [error, setError] = useState('');

  const [historyWorker, setHistoryWorker] = useState(null);
  const [historyShifts, setHistoryShifts] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!historyWorker) return;
    setHistoryLoading(true);
    getShiftHistory({ cashier: historyWorker._id, page: historyPage, limit: SHIFT_PAGE_SIZE })
      .then((data) => {
        setHistoryShifts(data.shifts);
        setHistoryTotal(data.total);
      })
      .finally(() => setHistoryLoading(false));
  }, [historyWorker, historyPage]);

  function openHistory(worker) {
    setHistoryPage(1);
    setHistoryWorker(worker);
  }

  function openEditor(worker) {
    setEditing(worker);
    setSelectedPermissions(worker.permissions || []);
  }

  function togglePermission(key) {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  function reload() {
    setLoading(true);
    listWorkers()
      .then((data) => setWorkers(data.workers))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.target);
    try {
      if (editing._id) {
        await updateWorker(editing._id, { name: form.get('name'), permissions: selectedPermissions });
      } else {
        await createWorker({
          name: form.get('name'),
          username: form.get('username'),
          password: form.get('password'),
          permissions: selectedPermissions,
        });
      }
      setEditing(null);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(worker) {
    await updateWorker(worker._id, { active: !worker.active });
    reload();
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.target);
    try {
      await resetWorkerPassword(resettingId, form.get('password'));
      setResettingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Xodimlar"
        subtitle="Kassirlar ro'yxati"
        action={<Button onClick={() => openEditor({})}>+ Xodim qo'shish</Button>}
      />

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Ism</th>
              <th>Login</th>
              <th>Holat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w, i) => (
              <tr key={w._id} className="animate-fade-up" style={{ '--i': i }}>
                <td className="font-medium">{w.name}</td>
                <td className="text-base-content/70">{w.username}</td>
                <td>
                  <Badge tone={w.active ? 'success' : 'neutral'}>{w.active ? 'Faol' : "Faol emas"}</Badge>
                </td>
                <td className="whitespace-nowrap text-right">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditor(w)}>
                    Tahrirlash
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setResettingId(w._id)}>
                    Parolni almashtirish
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(w)}>
                    {w.active ? 'Faolsizlantirish' : 'Faollashtirish'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openHistory(w)}>
                    Smena tarixi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && workers.length === 0 && (
          <div className="py-10 text-center text-base-content/50">Hali xodim qo'shilmagan.</div>
        )}
      </div>

      {editing && (
        <Modal title={editing._id ? 'Xodimni tahrirlash' : "Yangi xodim"} onClose={() => setEditing(null)}>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1 block text-sm text-base-content/60">Ism</span>
              <input
                className="input input-bordered w-full"
                name="name"
                defaultValue={editing.name}
                required
                autoFocus
              />
            </label>
            {!editing._id && (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm text-base-content/60">Login</span>
                  <input className="input input-bordered w-full" name="username" required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm text-base-content/60">Parol</span>
                  <input className="input input-bordered w-full" name="password" type="password" required />
                </label>
              </>
            )}
            <div>
              <span className="mb-1.5 block text-sm text-base-content/60">
                Qaysi sahifalarni ko'ra oladi (Kassa har doim ochiq)
              </span>
              <div className="flex flex-col gap-1.5">
                {PERMISSION_OPTIONS.map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selectedPermissions.includes(opt.key)}
                      onChange={() => togglePermission(opt.key)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Bekor qilish
              </Button>
              <Button type="submit">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}

      {resettingId && (
        <Modal title="Yangi parol o'rnatish" onClose={() => setResettingId(null)}>
          <form className="flex flex-col gap-3" onSubmit={handleResetPassword}>
            <label className="block">
              <span className="mb-1 block text-sm text-base-content/60">Yangi parol</span>
              <input className="input input-bordered w-full" name="password" type="password" required autoFocus />
            </label>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setResettingId(null)}>
                Bekor qilish
              </Button>
              <Button type="submit">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}

      {historyWorker && (
        <Modal title={`${historyWorker.name} — smena tarixi`} onClose={() => setHistoryWorker(null)}>
          <div className="-mx-1 max-h-[60vh] overflow-y-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Boshlandi</th>
                  <th>Tugadi</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {historyShifts.map((s) => (
                  <tr key={s._id}>
                    <td className="whitespace-nowrap">{formatShiftTime(s.startedAt)}</td>
                    <td className="whitespace-nowrap">{formatShiftTime(s.endedAt) || '—'}</td>
                    <td>
                      <Badge tone={s.status === 'open' ? 'success' : 'neutral'}>
                        {s.status === 'open' ? 'Ochiq' : 'Yopiq'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!historyLoading && historyShifts.length === 0 && (
              <div className="py-8 text-center text-base-content/50">Smena tarixi yo'q.</div>
            )}
          </div>
          <Pagination page={historyPage} limit={SHIFT_PAGE_SIZE} total={historyTotal} onChange={setHistoryPage} />
        </Modal>
      )}
    </div>
  );
}
