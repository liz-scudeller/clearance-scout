import { useEffect, useState } from 'react';
import AdminDealTable from '../components/AdminDealTable';
import { deleteDeal, getPendingDeals, updateDealStatus } from '../services/api';

export default function Admin() {
  const [deals, setDeals] = useState([]);
  const [message, setMessage] = useState('');

  async function loadPendingDeals() {
    setMessage('');
    try {
      const data = await getPendingDeals();
      setDeals(data.deals || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateDealStatus(id, status);
      await loadPendingDeals();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteDeal(id);
      setDeals((current) => current.filter((deal) => deal.id !== id));
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => { loadPendingDeals(); }, []);

  return <main className="mx-auto max-w-6xl px-4 py-8"><h1 className="text-3xl font-bold text-ink">Admin Review</h1><p className="mt-1 text-stone-600">Approve, reject, expire, or delete submitted deals.</p>{message && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}<div className="mt-5"><AdminDealTable deals={deals} onStatusChange={handleStatusChange} onDelete={handleDelete} /></div></main>;
}
