import { useEffect, useState } from 'react';
import { createWorker, listWorkers, resetWorkerPassword, updateWorker } from '../api/workers.api';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';

export function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [error, setError] = useState('');

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
        await updateWorker(editing._id, { name: form.get('name') });
      } else {
        await createWorker({
          name: form.get('name'),
          username: form.get('username'),
          password: form.get('password'),
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
        action={<Button onClick={() => setEditing({})}>+ Xodim qo'shish</Button>}
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
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(w)}>
                    Tahrirlash
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setResettingId(w._id)}>
                    Parolni almashtirish
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(w)}>
                    {w.active ? 'Faolsizlantirish' : 'Faollashtirish'}
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
    </div>
  );
}
