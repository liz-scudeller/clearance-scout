import { useState } from 'react';
import { confirmDeal } from '../services/api';

export default function ConfirmationButtons({ dealId, onConfirmed, variant = 'compact' }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(status) {
    setLoading(true);
    setMessage('');
    try {
      await confirmDeal(dealId, status);
      setMessage('Thanks for confirming.');
      onConfirmed?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const large = variant === 'large';

  return (
    <div className={large ? 'grid grid-cols-2 gap-4' : 'flex flex-wrap items-center gap-2'}>
      <button disabled={loading} onClick={() => submit('active')} className={large ? 'rounded-xl bg-brand px-4 py-4 text-base font-black text-white shadow-sm disabled:opacity-60' : 'rounded bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-60'}>Still active</button>
      <button disabled={loading} onClick={() => submit('expired')} className={large ? 'rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-base font-black text-red-600 disabled:opacity-60' : 'rounded bg-stone-100 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-60'}>No longer active</button>
      {message && <span className="w-full text-xs text-stone-600">{message}</span>}
    </div>
  );
}
