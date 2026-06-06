import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmationButtons from '../components/ConfirmationButtons';
import { useAuth } from '../hooks/useAuth';
import { getDeal } from '../services/api';
import { isDealSaved, subscribeToSavedDeals, toggleSavedDeal } from '../services/savedDeals';
import { labelize } from '../utils/options';

export default function DealDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const [deal, setDeal] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(() => isDealSaved(userId, id));

  async function loadDeal() {
    try {
      const data = await getDeal(id);
      setDeal(data.deal);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadDeal(); }, [id]);
  useEffect(() => {
    setSaved(isDealSaved(userId, id));
    return subscribeToSavedDeals(() => setSaved(isDealSaved(userId, id)));
  }, [userId, id]);

  if (error) return <main className="mx-auto max-w-3xl px-4 py-8 text-red-700">{error}</main>;
  if (!deal) return <main className="mx-auto max-w-3xl px-4 py-8 text-stone-600">Loading...</main>;

  const confidence = deal.ai_confidence_score || deal.source_confidence || deal.confidence_score || 0;
  const active = deal.active_confirmation_count || 0;
  const expired = deal.expired_confirmation_count || 0;
  const sourceHost = formatSourceHost(deal.source_url);
  const address = [deal.address, deal.city, deal.province].filter(Boolean).join(', ');

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white pb-8 md:my-6 md:rounded-[28px] md:shadow-2xl">
      <section className="relative h-[278px] overflow-hidden bg-app-ink md:h-[300px] md:rounded-t-[28px]">
        {deal.image_url ? (
          <img src={deal.image_url} alt={deal.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-app-ink to-brand text-4xl font-black text-white">{deal.store_name?.slice(0, 10) || 'SALE'}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/15" />
        <Link className="absolute left-5 top-10 grid h-10 w-10 place-items-center rounded-full bg-black/18 text-white backdrop-blur" to="/deals">
          <BackIcon />
        </Link>
        <div className="absolute right-5 top-10 flex gap-3 text-white">
          <button aria-label="Share" className="grid h-10 w-10 place-items-center rounded-full bg-black/18 backdrop-blur"><ShareIcon /></button>
          <button onClick={() => setSaved(toggleSavedDeal(userId, id))} aria-label={saved ? 'Remove saved deal' : 'Save deal'} className={`grid h-10 w-10 place-items-center rounded-full bg-black/18 backdrop-blur ${saved ? 'text-deal-amber' : ''}`}><HeartIcon filled={saved} /></button>
        </div>
      </section>

      <section className="-mt-6 rounded-t-[28px] bg-white px-5 pb-8 pt-4">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <span className={`rounded-md px-3 py-1.5 text-xs font-black uppercase text-white ${saleBadgeClass(deal.sale_type)}`}>
            {labelize(deal.sale_type)}
          </span>
          <span className={`rounded-md px-3 py-1.5 text-xs font-black ${confidenceClass(confidence)}`}>
            {publicStatusLabel(confidence)}
          </span>
        </div>

        <h1 className="mt-4 text-[27px] font-black leading-tight text-app-ink">{cleanTitle(deal)}</h1>
        <p className="mt-2 text-2xl font-black text-deal-orange">{deal.discount_text || 'Deal details available'}</p>

        <div className="mt-4 space-y-2 text-[15px] font-medium leading-6 text-app-text">
          <p className="flex items-start gap-2"><PinIcon />{deal.store_name || 'Unknown store'}</p>
          <p className="flex items-start gap-2"><PinIcon />{address || 'Location missing'}</p>
          <p className="text-sm font-semibold text-app-text"><span className="text-[#2563EB]">1.8 km away</span> · Updated {formatUpdated(deal.updated_at || deal.created_at).toLowerCase()}</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <a href={directionsUrl(deal)} target="_blank" rel="noreferrer" className="rounded-xl bg-brand px-3 py-3 text-center text-sm font-black text-white">Directions</a>
          {deal.source_url ? (
            <a href={deal.source_url} target="_blank" rel="noreferrer" className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-center text-sm font-black text-app-ink">Source</a>
          ) : (
            <button disabled className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-center text-sm font-black text-stone-400">Source</button>
          )}
          <button className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-center text-sm font-black text-app-ink">Share</button>
        </div>

        <div className="mt-5 rounded-xl bg-[#FFF1E8] px-4 py-3 text-sm font-semibold leading-6 text-deal-orange">
          Auto-detected from public sources. Confirm with the store before visiting.
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-black text-app-ink">Details</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <DetailTile label="Sale type" value={labelize(deal.sale_type)} />
            <DetailTile label="Distance" value="1.8 km" />
            <DetailTile label="Updated" value={formatUpdated(deal.updated_at || deal.created_at)} />
            <DetailTile label="Categories" value={categoryLine(deal)} wide />
          </dl>
        </div>

        <div className="mt-6 border-t border-stone-200 pt-5">
          <h2 className="text-lg font-black text-app-ink">About</h2>
          <p className="mt-3 text-[15px] leading-7 text-app-ink">{deal.ai_summary || deal.description || 'No description provided yet.'}</p>
          <p className="mt-3 text-sm font-medium text-app-text">Source: {sourceHost || 'Public source'}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-[#FAFAFA] p-4">
          <h2 className="text-lg font-black text-app-ink">Community status</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <StatusBox tone="green" value={active} label="confirmed active" />
            <StatusBox tone="red" value={expired} label="marked expired" />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-deal-green" style={{ width: `${confirmationRatio(active, expired)}%` }} />
          </div>
        </div>

        <div className="mt-7">
          {deal.status === 'active' && <ConfirmationButtons dealId={deal.id} onConfirmed={loadDeal} variant="large" />}
          <button className="mt-5 w-full px-4 py-2 text-center text-sm font-black text-app-ink">Report update</button>
        </div>
      </section>
    </main>
  );
}

function DetailTile({ label, value, wide = false }) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-3 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-xs font-black uppercase text-app-text">{label}</dt>
      <dd className="mt-1 text-sm font-black text-app-ink">{value}</dd>
    </div>
  );
}

function StatusBox({ tone, value, label }) {
  const toneClass = tone === 'green' ? 'text-[#166534] bg-[#DCFCE7]' : 'text-red-700 bg-red-50';
  return (
    <div className={`rounded-xl px-3 py-3 ${toneClass}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-0.5 text-xs font-bold">{label}</p>
    </div>
  );
}

function PinIcon() {
  return <span className="mt-0.5 shrink-0 text-app-ink"><LineIcon name="pin" /></span>;
}

function saleBadgeClass(saleType) {
  if (saleType === 'warehouse_sale') return 'bg-[#2563EB]';
  if (saleType === 'clearance') return 'bg-[#166534]';
  return 'bg-[#FF6B0A]';
}

function confidenceClass(score) {
  if (score >= 80) return 'bg-[#BFE6C9] text-brand-700';
  if (score >= 60) return 'bg-[#FFE7B8] text-[#8A4B00]';
  return 'bg-stone-100 text-stone-600';
}

function publicStatusLabel(score) {
  if (score >= 80) return 'Likely active';
  if (score >= 60) return 'Auto-detected';
  if (score > 0) return 'Check source';
  return 'Needs confirmation';
}

function categoryLine(deal) {
  const firstKeyword = Array.isArray(deal.keywords) ? deal.keywords[0] : String(deal.keywords || '').split(',')[0].trim();
  const values = [labelize(deal.category), deal.subcategory, firstKeyword].filter(Boolean);
  if (!values.length) return 'Local deal';
  return values.slice(0, 3).join(' - ');
}

function formatUpdated(dateValue) {
  if (!dateValue) return 'Today';
  const date = new Date(dateValue);
  const today = new Date();
  const days = Math.floor((today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString();
}

function formatSourceHost(sourceUrl) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    return sourceUrl;
  }
}

function cleanTitle(deal) {
  const title = deal.title || '';
  return title.replace(/\bStore Closing Store Closing\b/gi, 'Store Closing').replace(/\bStore Closing Sale\b/gi, 'Closing Sale');
}

function directionsUrl(deal) {
  const query = [deal.address, deal.city, deal.province, deal.store_name].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || deal.title || '')}`;
}

function confirmationRatio(active, expired) {
  const total = active + expired;
  if (!total) return 0;
  return Math.max(8, Math.round((active / total) * 100));
}

function LineIcon({ name }) {
  const common = { stroke: 'currentColor', strokeWidth: 2.1, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    tag: <><path {...common} d="M4 12V5h7l9 9-6 6-10-8Z" /><path {...common} d="M8.5 8.5h.01" /></>,
    discount: <><path {...common} d="m19 5-14 14" /><path {...common} d="M7 8h.01M17 16h.01" /></>,
    bag: <><path {...common} d="M7 8h10v12H7V8Z" /><path {...common} d="M9 8a3 3 0 0 1 6 0" /></>,
    pin: <><path {...common} d="M12 21s6-4.5 6-11a6 6 0 0 0-12 0c0 6.5 6 11 6 11Z" /><path {...common} d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /></>,
    shield: <><path {...common} d="M12 3 19 6v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3Z" /></>,
    clock: <><path {...common} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /><path {...common} d="M12 7v5l3 2" /></>
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {paths[name] || paths.tag}
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15V4m0 0 4 4m-4-4-4 4M6 11v8h12v-8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled = false }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d="M20 8.5c0 5-8 10.5-8 10.5S4 13.5 4 8.5A4.2 4.2 0 0 1 12 6a4.2 4.2 0 0 1 8 2.5Z" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
