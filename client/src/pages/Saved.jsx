import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DealCard from '../components/DealCard';
import { useAuth } from '../hooks/useAuth';
import { getDeals } from '../services/api';
import { getSavedDealIds, subscribeToSavedDeals } from '../services/savedDeals';

export default function Saved() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const [savedIds, setSavedIds] = useState(() => getSavedDealIds(userId));
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDeals() {
    setLoading(true);
    setError('');
    try {
      const data = await getDeals({ status: 'active' });
      setDeals(data.deals || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSavedIds(getSavedDealIds(userId));
    return subscribeToSavedDeals(() => setSavedIds(getSavedDealIds(userId)));
  }, [userId]);

  useEffect(() => {
    loadDeals();
  }, []);

  const savedDeals = useMemo(() => {
    const byId = new Map(deals.map((deal) => [deal.id, deal]));
    return savedIds.map((id) => byId.get(id)).filter(Boolean);
  }, [deals, savedIds]);

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-6 md:max-w-6xl md:pb-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-deal-amber">Your list</p>
          <h1 className="mt-1 text-3xl font-black text-brand-700">Saved Deals</h1>
          <p className="mt-2 text-base text-stone-600">{savedIds.length} saved deal{savedIds.length === 1 ? '' : 's'}</p>
        </div>
        <Link to="/deals" className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-brand shadow-sm">
          Browse
        </Link>
      </header>

      {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading ? <p className="mt-6 text-sm text-stone-600">Loading saved deals...</p> : null}

      {!loading && savedDeals.length > 0 && (
        <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {savedDeals.map((deal) => <DealCard key={deal.id} deal={deal} onConfirmed={loadDeals} />)}
        </section>
      )}

      {!loading && !savedDeals.length && (
        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FFF1E0] text-deal-orange">
            <HeartIcon />
          </div>
          <h2 className="mt-4 text-xl font-black text-app-ink">No saved deals yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">Tap the heart on a deal to keep it here while you compare stores.</p>
          <Link to="/deals" className="mt-5 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-black text-white">
            Find Deals
          </Link>
        </section>
      )}
    </main>
  );
}

function HeartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 8.5c0 5-8 10.5-8 10.5S4 13.5 4 8.5A4.2 4.2 0 0 1 12 6a4.2 4.2 0 0 1 8 2.5Z" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
