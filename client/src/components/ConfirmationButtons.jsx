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
      <button disabled={loading} onClick={() => submit('active')} className={large ? 'rounded-xl bg-brand px-4 py-4 text-base font-black text-white shadow-sm disabled:opacity-60' : 'rounded bg-mint px-3 py-2 text-sm font-semibold text-white disabled:opacity-60'}>Still Active</button>
      <button disabled={loading} onClick={() => submit('expired')} className={large ? 'rounded-xl border border-red-500 bg-white px-4 py-4 text-base font-black text-red-600 disabled:opacity-60' : 'rounded bg-stone-200 px-3 py-2 text-sm font-semibold text-ink disabled:opacity-60'}>No Longer Active</button>
      {message && <span className="w-full text-xs text-stone-600">{message}</span>}
    </div>
  );
}
