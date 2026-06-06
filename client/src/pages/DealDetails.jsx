import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmationButtons from '../components/ConfirmationButtons';
import { getDeal } from '../services/api';
import { labelize } from '../utils/options';

export default function DealDetails() {
  const { id } = useParams();
  const [deal, setDeal] = useState(null);
  const [error, setError] = useState('');

  async function loadDeal() {
    try {
      const data = await getDeal(id);
      setDeal(data.deal);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadDeal(); }, [id]);

  if (error) return <main className="mx-auto max-w-3xl px-4 py-8 text-red-700">{error}</main>;
  if (!deal) return <main className="mx-auto max-w-3xl px-4 py-8 text-stone-600">Loading...</main>;

  const confidence = deal.ai_confidence_score || deal.source_confidence || deal.confidence_score || 0;
  const active = deal.active_confirmation_count || 0;
  const expired = deal.expired_confirmation_count || 0;
  const sourceHost = formatSourceHost(deal.source_url);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white pb-8 md:my-6 md:rounded-[28px] md:shadow-2xl">
      <section className="relative h-[320px] overflow-hidden bg-app-ink md:rounded-t-[28px]">
        {deal.image_url ? (
          <img src={deal.image_url} alt={deal.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-app-ink to-brand text-4xl font-black text-white">{deal.store_name?.slice(0, 10) || 'SALE'}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/15" />
        <Link className="absolute left-5 top-12 grid h-10 w-10 place-items-center rounded-full text-white" to="/deals">
          <BackIcon />
        </Link>
        <div className="absolute right-5 top-12 flex gap-4 text-white">
          <button aria-label="Share" className="grid h-10 w-10 place-items-center rounded-full"><ShareIcon /></button>
          <button aria-label="Save" className="grid h-10 w-10 place-items-center rounded-full"><HeartIcon /></button>
        </div>
      </section>

      <section className="-mt-7 rounded-t-[24px] bg-white px-5 pb-8 pt-0">
        <div className="relative z-10 mb-5 flex items-start justify-between gap-3">
          <span className={`rounded-lg px-3 py-2 text-sm font-black uppercase text-white ${saleBadgeClass(deal.sale_type)}`}>
            {labelize(deal.sale_type)}
          </span>
          <span className={`rounded-lg px-3 py-2 text-sm font-bold ${confidenceClass(confidence)}`}>
            {confidenceLabel(confidence)}
          </span>
        </div>

        <h1 className="text-[26px] font-black leading-tight text-app-ink">{deal.title}</h1>
        <div className="mt-4 space-y-2 text-base font-medium text-app-text">
          <p className="flex items-start gap-2"><PinIcon />{deal.store_name || 'Unknown store'}</p>
          <p className="flex items-start gap-2"><PinIcon />{[deal.address, deal.city, deal.province].filter(Boolean).join(', ') || 'Location missing'}</p>
        </div>

        <div className="mt-5 rounded-xl bg-[#FFF1E0] px-4 py-3 text-base font-medium leading-7 text-deal-orange">
          <p>Detected automatically from public sources.</p>
          <p>Please confirm with the store before visiting.</p>
        </div>

        <dl className="mt-6 grid gap-4 text-base">
          <Info icon="tag" label="Sale type" value={labelize(deal.sale_type)} />
          <Info icon="discount" label="Discount" value={deal.discount_text || 'Not listed'} />
          <Info icon="bag" label="Categories" value={categoryLine(deal)} />
          <Info icon="pin" label="Distance" value="1.8 km from you" />
          <Info icon="shield" label="Confidence" value={`${shortConfidenceLabel(confidence)} (${confidence || 0}%)`} highlight />
          <Info icon="clock" label="Last updated" value={formatUpdated(deal.updated_at || deal.created_at)} />
        </dl>

        <div className="mt-6 border-t border-stone-200 pt-5">
          <h2 className="text-xl font-black text-app-ink">About this deal</h2>
          <p className="mt-3 text-base leading-7 text-app-ink">{deal.ai_summary || deal.description || 'No description provided yet.'}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-black text-app-ink">Source</h2>
          {deal.source_url ? (
            <div className="mt-3 flex items-center justify-between gap-4">
              <a className="min-w-0 flex-1 truncate text-base font-semibold text-brand underline" href={deal.source_url} target="_blank" rel="noreferrer">{sourceHost}</a>
              <a className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-bold text-app-ink" href={deal.source_url} target="_blank" rel="noreferrer">View Original Source</a>
            </div>
          ) : (
            <p className="mt-3 text-base text-stone-600">No source link provided.</p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-black text-app-ink">Community confirmations</h2>
          <p className="mt-3 text-base font-medium text-app-ink"><span className="font-black text-green-700">+ </span>{active} people confirmed still active</p>
          <p className="mt-2 text-base font-medium text-app-ink"><span className="font-black text-red-600">x </span>{expired} people marked as expired</p>
        </div>

        <div className="mt-7">
          {deal.status === 'active' && <ConfirmationButtons dealId={deal.id} onConfirmed={loadDeal} variant="large" />}
          <button className="mt-5 w-full px-4 py-2 text-center text-base font-semibold text-app-ink">Report Update</button>
        </div>
      </section>
    </main>
  );
}

function Info({ icon, label, value, highlight = false }) {
  return (
    <div className="grid grid-cols-[28px_1fr_1.7fr] items-start gap-3">
      <dt className="grid h-6 w-6 place-items-center text-app-ink"><LineIcon name={icon} /></dt>
      <dt className="font-medium text-app-ink">{label}</dt>
      <dd className={`font-medium ${highlight ? 'text-brand' : 'text-app-ink'}`}>{value}</dd>
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

function confidenceLabel(score) {
  if (score >= 80) return 'High confidence';
  if (score >= 60) return 'Medium confidence';
  if (score > 0) return 'Low confidence';
  return 'Needs review';
}

function shortConfidenceLabel(score) {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  if (score > 0) return 'Low';
  return 'Needs review';
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

function HeartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 8.5c0 5-8 10.5-8 10.5S4 13.5 4 8.5A4.2 4.2 0 0 1 12 6a4.2 4.2 0 0 1 8 2.5Z" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
