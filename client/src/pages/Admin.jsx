import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminDealTable from '../components/AdminDealTable';
import {
  deleteDeal,
  getPendingDeals,
  runScanners,
  updateAdminDeal,
  updateDealStatus
} from '../services/api';

const originFilters = [
  { label: 'All pending', value: '' },
  { label: 'User reports', value: 'user' },
  { label: 'Internal search', value: 'internal' },
  { label: 'AI scanner', value: 'ai' }
];

const PAGE_SIZE = 10;

export default function Admin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [filters, setFilters] = useState({
    origin: '',
    city: '',
    search: '',
    missingSource: false
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [page, setPage] = useState(1);

  async function loadPendingDeals() {
    setLoading(true);
    setMessage('');

    try {
      const data = await getPendingDeals(filters);
      setDeals(data.deals || []);
    } catch (error) {
      setMessageType('error');
      setMessage(error.message || 'Failed to load pending deals.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, status) {
    setActionLoadingId(id);
    setMessage('');

    try {
      await updateDealStatus(id, status);

      if (status === 'active') {
        navigate('/deals');
        return;
      }

      await loadPendingDeals();

      setMessageType('success');
      setMessage(`Deal marked as ${status}.`);
    } catch (error) {
      setMessageType('error');
      setMessage(error.message || 'Failed to update deal status.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Delete this deal permanently?');
    if (!confirmed) return;

    setActionLoadingId(id);
    setMessage('');

    try {
      await deleteDeal(id);
      setDeals((current) => current.filter((deal) => deal.id !== id));

      setMessageType('success');
      setMessage('Deal deleted.');
    } catch (error) {
      setMessageType('error');
      setMessage(error.message || 'Failed to delete deal.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSaveDeal(id, deal) {
    setActionLoadingId(id);
    setMessage('');

    try {
      await updateAdminDeal(id, deal);
      await loadPendingDeals();

      setMessageType('success');
      setMessage('Deal updated.');
    } catch (error) {
      setMessageType('error');
      setMessage(error.message || 'Failed to save deal.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handlePullData() {
    setPulling(true);
    setMessageType('info');
    setMessage('Searching public sources and running AI review...');

    try {
      const result = await runScanners();
      await loadPendingDeals();

      const runs = result.runs || [];
      const failedRuns = runs.filter((run) => run.status === 'failed');
      const found = runs.reduce((sum, run) => sum + Number(run.results_found || 0), 0);
      const saved = runs.reduce((sum, run) => sum + Number(run.results_saved || 0), 0);

      if (failedRuns.length) {
        setMessageType('error');
        setMessage(`Search finished with scanner errors: ${failedRuns.map((run) => `${run.scanner_name}: ${run.error_message}`).join('; ')}`);
        return;
      }

      setMessageType('success');
      setMessage(`Search finished. Found ${found} mentions, saved ${saved} new ones. Valid AI-approved candidates are now in this approval list.`);
    } catch (error) {
      setMessageType('error');
      setMessage(error.message || 'Failed to pull public data.');
    } finally {
      setPulling(false);
    }
  }

  function clearFilters() {
    setFilters({
      origin: '',
      city: '',
      search: '',
      missingSource: false
    });
  }

  useEffect(() => {
    loadPendingDeals();
  }, []);

  useEffect(() => {
    if (!searchParams.get('converted')) return;
    setMessageType('success');
    setMessage('Mention converted. Review, edit, approve, or reject the pending deal below.');
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadPendingDeals();
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [filters.origin, filters.city, filters.search, filters.missingSource]);

  const filteredDeals = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const city = filters.city.trim().toLowerCase();

    return deals.filter((deal) => {
      if (search) {
        const haystack = [
          deal.title,
          deal.store_name,
          deal.city,
          deal.reporter_email,
          deal.source_type,
          deal.detection_method,
          deal.description
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(search)) return false;
      }

      if (city && !String(deal.city || '').toLowerCase().includes(city)) {
        return false;
      }

      if (filters.origin === 'user' && !deal.reported_by) return false;
      if (filters.origin === 'internal' && deal.detection_method !== 'scanner') return false;
      if (filters.origin === 'ai' && deal.detection_method !== 'automated_ai') return false;

      if (filters.missingSource && deal.source_url) return false;

      return true;
    });
  }, [deals, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / PAGE_SIZE));

  const paginatedDeals = filteredDeals.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const stats = {
    total: filteredDeals.length,
    userReports: filteredDeals.filter((deal) => deal.reported_by).length,
    internalSearch: filteredDeals.filter((deal) => deal.detection_method === 'scanner').length,
    aiScanner: filteredDeals.filter((deal) => deal.detection_method === 'automated_ai').length
  };

  return (
    <main className="min-h-screen bg-app-paper px-4 py-8 text-app-ink">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-wide text-deal-orange">
          Admin
        </p>

        <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-brand">
              Admin Approval
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-app-text">
              Approve valid deals to publish them on the home feed. Reject anything that should not go live.
            </p>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-app-ink">
              Deals waiting for approval
            </h2>
            <p className="mt-1 text-sm leading-6 text-app-text">
              User reports and deals found by search/AI land here. Open details to see who submitted it or which public source found it.
            </p>
          </div>

          <div className="grid gap-2 md:w-[190px]">
            <button
              type="button"
              onClick={handlePullData}
              disabled={pulling}
              className="h-11 rounded-xl border border-brand bg-white px-3 text-sm font-black text-brand shadow-sm transition hover:bg-brand/5 disabled:opacity-50"
            >
              {pulling ? 'Searching...' : 'Find new deals'}
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-black uppercase text-stone-500">
            <span>{stats.total} pending</span>
            <span>{stats.userReports} user reports</span>
            <span>{stats.internalSearch + stats.aiScanner} scanner/AI</span>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Search title, store, reporter, city..."
              className="h-11 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-brand"
            />

            <input
              value={filters.city}
              onChange={(event) =>
                setFilters((current) => ({ ...current, city: event.target.value }))
              }
              placeholder="City"
              className="h-11 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-brand"
            />

            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl border border-stone-200 px-4 text-sm font-black text-app-ink"
            >
              Clear
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {originFilters.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  setFilters((current) => ({ ...current, origin: item.value }))
                }
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${
                  filters.origin === item.value
                    ? 'bg-brand text-white'
                    : 'bg-[#FBF7F3] text-brand ring-1 ring-stone-200'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  missingSource: !current.missingSource
                }))
              }
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${
                filters.missingSource
                  ? 'bg-red-700 text-white'
                  : 'bg-[#FBF7F3] text-red-700 ring-1 ring-red-100'
              }`}
            >
              Missing source
            </button>
          </div>
        </section>

        {message && (
          <p
            className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
              messageType === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : messageType === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-stone-200 bg-white text-stone-700'
            }`}
          >
            {message}
          </p>
        )}

        <section className="mt-5">
          {loading ? (
            <p className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
              Loading pending deals...
            </p>
          ) : (
            <>
              <AdminDealTable
                deals={paginatedDeals}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onSaveDeal={handleSaveDeal}
                actionLoadingId={actionLoadingId}
              />

              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={filteredDeals.length}
                visibleCount={paginatedDeals.length}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function Pagination({ page, totalPages, totalCount, visibleCount, onPageChange }) {
  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = totalCount === 0 ? 0 : start + visibleCount - 1;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-medium text-app-text">
        Showing {start} to {end} of {totalCount} pending deals
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-sm font-black text-app-ink disabled:opacity-40"
        >
          &lt;
        </button>

        <span className="rounded-xl bg-brand px-4 py-2 text-sm font-black text-white">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-sm font-black text-app-ink disabled:opacity-40"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
