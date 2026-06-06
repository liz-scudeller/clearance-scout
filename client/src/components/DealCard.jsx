import { Link } from 'react-router-dom';
import { labelize } from '../utils/options';
import ConfirmationButtons from './ConfirmationButtons';

export default function DealCard({ deal, onConfirmed }) {
  const activeConfirmations = deal.active_confirmation_count || 0;
  const confidence = deal.ai_confidence_score || deal.source_confidence || deal.confidence_score || 0;
  const updatedLabel = formatUpdated(deal.updated_at || deal.created_at);

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-[0_5px_16px_rgba(0,0,0,.06)]">
      <Link to={`/deals/${deal.id}`} className="grid min-h-[138px] grid-cols-[1fr_112px] gap-3 p-3">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start justify-between gap-3">
            <span className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase leading-none text-white ${saleBadgeClass(deal.sale_type)}`}>
              {labelize(deal.sale_type)}
            </span>
          </div>
          <h2 className="mt-2 line-clamp-2 text-[15px] font-black leading-tight text-app-ink">{deal.title}</h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold leading-tight text-app-text">
            <PinMiniIcon />
            {deal.store_name || deal.city}{deal.city ? `, ${deal.city}` : ''}
          </p>
          <p className="mt-2 text-[17px] font-black leading-none text-deal-orange">
            {deal.discount_text || 'Deal details available'}
          </p>
          <p className="mt-2 line-clamp-1 text-[11px] font-medium leading-tight text-app-text">
            {categoryLine(deal)}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium leading-tight text-app-text">
            <PinMiniIcon />
            1.8 km away
          </p>
          <span className="mt-auto pt-2 text-[11px] font-medium text-stone-500">{updatedLabel}</span>
        </div>

        <div className="flex min-w-0 flex-col items-end">
          <span className={`mb-2 rounded-md px-2.5 py-1 text-[10px] font-bold leading-none ${confidenceClass(confidence)}`}>
            {confidenceLabel(confidence)}
          </span>
          <div className="h-[86px] w-full overflow-hidden rounded-xl bg-stone-100">
            {deal.image_url ? (
              <img src={deal.image_url} alt={deal.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-700 to-brand-950 text-sm font-black text-white">
                SALE
              </div>
            )}
          </div>
          <span className="mt-auto pt-2 text-right text-[11px] font-semibold leading-tight text-brand">{activeConfirmations} confirmed active</span>
        </div>
      </Link>
      {deal.status === 'active' && (
        <div className="hidden px-4 pb-4 sm:block">
          <ConfirmationButtons dealId={deal.id} onConfirmed={onConfirmed} />
        </div>
      )}
    </article>
  );
}

function saleBadgeClass(saleType) {
  if (saleType === 'warehouse_sale') return 'bg-[#2563EB]';
  if (saleType === 'clearance') return 'bg-[#166534]';
  return 'bg-deal-orange';
}

function confidenceClass(score) {
  if (score >= 80) return 'bg-[#F6DFDF] text-brand-700';
  if (score >= 60) return 'bg-[#F6DFDF] text-brand-700';
  return 'bg-stone-100 text-stone-600';
}

function confidenceLabel(score) {
  if (score >= 80) return 'High confidence';
  if (score >= 60) return 'Medium confidence';
  if (score > 0) return 'Low confidence';
  return 'Needs confirmation';
}

function PinMiniIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-app-ink" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s6-4.5 6-11a6 6 0 0 0-12 0c0 6.5 6 11 6 11Z" stroke="currentColor" strokeWidth="2.2" />
      <path d="M12 12a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

function categoryLine(deal) {
  const firstKeyword = Array.isArray(deal.keywords) ? deal.keywords[0] : String(deal.keywords || '').split(',')[0].trim();
  const values = [labelize(deal.category), deal.subcategory, firstKeyword].filter(Boolean);
  if (!values.length) return 'Local deal';
  return values.slice(0, 3).join(' - ');
}

function formatUpdated(dateValue) {
  if (!dateValue) return 'Updated today';
  const date = new Date(dateValue);
  const today = new Date();
  const days = Math.floor((today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  return `Updated ${date.toLocaleDateString()}`;
}
