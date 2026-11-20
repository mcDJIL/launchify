import { useState, useEffect } from 'react';
import { RefreshCw, Save, Settings as SettingsIcon, Box } from 'lucide-react';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/auth';

const rupiah = (value) => `Rp ${parseFloat(value || 0).toLocaleString('id-ID')}`;

export default function AdminSettings() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState({ base_daily_rate: 1000, max_containers_per_user: 3 });
  const [plans, setPlans] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPlanId, setSavingPlanId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.settings);
      setPlans(res.data.plans || []);

      const nextEdits = {};
      (res.data.plans || []).forEach((plan) => {
        nextEdits[plan.id] = {
          name: plan.name,
          price_per_hour: plan.price_per_hour,
          dockerfile: plan.dockerfile || plan.default_dockerfile || '',
        };
      });
      setEdits(nextEdits);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.message || 'Gagal mengambil pengaturan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.put('/admin/settings', {
        base_daily_rate: Number(settings.base_daily_rate),
        max_containers_per_user: Number(settings.max_containers_per_user),
      });
      setNotice({ type: 'success', text: res.data.message });
      await fetchSettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSavingSettings(false);
    }
  };

  const updateEdit = (planId, field, value) => {
    setEdits((current) => ({ ...current, [planId]: { ...current[planId], [field]: value } }));
  };

  const savePlan = async (plan) => {
    const edit = edits[plan.id];
    setSavingPlanId(plan.id);
    setError(null);
    setNotice(null);
    try {
      const res = await api.put(`/admin/plans/${plan.id}`, {
        name: edit.name,
        price_per_hour: Number(edit.price_per_hour),
        dockerfile: edit.dockerfile,
      });
      setNotice({ type: 'success', text: `${res.data.data.name}: ${res.data.message}` });
      await fetchSettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan template.');
    } finally {
      setSavingPlanId(null);
    }
  };

  return (
    <AppLayout active="admin-settings">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Pengaturan platform</h1>
          <p className="mt-2 text-muted">Tarif dasar, batas container per user, dan katalog template.</p>
        </div>
        <button type="button" onClick={fetchSettings} className="btn-secondary px-5 py-3 text-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      {notice && (
        <div role="status" className="mt-6 rounded-xl border-2 border-ink bg-accent p-4 text-sm font-semibold text-on-accent">
          {notice.text}
        </div>
      )}

      <section className="card mt-8 p-6 md:p-8">
        <h2 className="font-display flex items-center gap-2 border-b-2 border-ink pb-3 text-2xl font-bold">
          <SettingsIcon className="h-6 w-6" /> Tarif &amp; limit
        </h2>
        <form onSubmit={saveSettings} className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="daily-rate" className="mb-2 block text-sm font-semibold">
              Tarif dasar per hari
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-muted">Rp</span>
              <input
                id="daily-rate"
                type="number"
                min="0"
                required
                className="field pl-12 text-lg font-semibold"
                value={settings.base_daily_rate}
                onChange={(event) => setSettings((current) => ({ ...current, base_daily_rate: event.target.value }))}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              Setara {rupiah(Number(settings.base_daily_rate || 0) / 24)}/jam. Harga template framework ikut disesuaikan.
            </p>
          </div>
          <div>
            <label htmlFor="max-containers" className="mb-2 block text-sm font-semibold">
              Maksimal container per user
            </label>
            <input
              id="max-containers"
              type="number"
              min="1"
              max="50"
              required
              className="field text-lg font-semibold"
              value={settings.max_containers_per_user}
              onChange={(event) => setSettings((current) => ({ ...current, max_containers_per_user: event.target.value }))}
            />
            <p className="mt-2 text-sm text-muted">Berlaku saat user membuat project baru.</p>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={savingSettings} className="btn-primary px-6 py-3 text-sm">
              <Save className="h-4 w-4" /> {savingSettings ? 'Menyimpan...' : 'Simpan pengaturan'}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Box className="h-5 w-5" /> Katalog template
        </h2>
        <p className="mt-1 text-sm text-muted">
          Dockerfile kustom dipakai saat build. Placeholder <code className="font-mono">{'{{PORT}}'}</code> diganti port container.
        </p>

        {loading ? (
          <p className="mt-6 animate-pulse text-muted">Memuat template...</p>
        ) : (
          <div className="mt-6 space-y-4">
            {plans.map((plan) => {
              const edit = edits[plan.id] || {};
              const isSaving = savingPlanId === plan.id;
              return (
                <div key={plan.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border-2 border-ink px-2 py-0.5 text-xs font-bold uppercase">{plan.type}</span>
                      <span className="font-mono text-xs text-muted">{plan.code}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => savePlan(plan)}
                      disabled={isSaving}
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      <Save className="h-4 w-4" /> {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <label htmlFor={`plan-name-${plan.id}`} className="mb-1 block text-xs font-bold uppercase text-muted">
                        Nama
                      </label>
                      <input
                        id={`plan-name-${plan.id}`}
                        className="field text-sm"
                        value={edit.name ?? ''}
                        onChange={(event) => updateEdit(plan.id, 'name', event.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`plan-price-${plan.id}`} className="mb-1 block text-xs font-bold uppercase text-muted">
                        Harga per jam
                      </label>
                      <input
                        id={`plan-price-${plan.id}`}
                        type="number"
                        step="0.0001"
                        min="0"
                        className="field text-sm"
                        value={edit.price_per_hour ?? 0}
                        onChange={(event) => updateEdit(plan.id, 'price_per_hour', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label htmlFor={`plan-dockerfile-${plan.id}`} className="mb-1 block text-xs font-bold uppercase text-muted">
                      Dockerfile
                    </label>
                    <textarea
                      id={`plan-dockerfile-${plan.id}`}
                      className="field min-h-40 font-mono text-xs"
                      spellCheck={false}
                      value={edit.dockerfile ?? ''}
                      onChange={(event) => updateEdit(plan.id, 'dockerfile', event.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
