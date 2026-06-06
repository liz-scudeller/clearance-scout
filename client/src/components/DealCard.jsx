import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { hideDeal } from '../services/hiddenDeals';
import { isDealSaved, saveDeal, subscribeToSavedDeals, toggleSavedDeal } from '../services/savedDeals';
import { labelize } from '../utils/options';
import ConfirmationButtons from './ConfirmationButtons';

const swipeThreshold = 88;

export default function DealCard({ deal, onConfirmed, onHidden }) {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const [saved, setSaved] = useState(() => isDealSaved(userId, deal.id));
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState('');
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const draggedRef = useRef(false);
  const activeConfirmations = deal.active_confirmation_count || 0;
  const confidence = deal.ai_confidence_score || deal.source_confidence || deal.confidence_score || 0;
  const updatedLabel = formatUpdated(deal.updated_at || deal.created_at);
  const urgency = urgencyLabel(deal);

  useEffect(() => {
    setSaved(isDealSaved(userId, deal.id));
    return subscribeToSavedDeals(() => setSaved(isDealSaved(userId, deal.id)));
  }, [userId, deal.id]);

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    draggedRef.current = false;
    setDragging(true);
    setLeaving('');
  }

  function handlePointerMove(event) {
    if (!dragging) return;
    const nextX = event.clientX - startXRef.current;
    const nextY = event.clientY - startYRef.current;
    if (Math.abs(nextY) > Math.abs(nextX) && Math.abs(nextY) > 22) return;
    if (Math.abs(nextX) > 8) draggedRef.current = true;
    setDragX(Math.max(-135, Math.min(135, nextX)));
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);

    if (dragX >= swipeThreshold) {
      setSaved(saveDeal(userId, deal.id));
      setLeaving('right');
      window.setTimeout(() => {
        setLeaving('');
        setDragX(0);
      }, 260);
      return;
    }

    if (dragX <= -swipeThreshold) {
      hideDeal(userId, deal.id);
      setLeaving('left');
      window.setTimeout(() => onHidden?.(deal.id), 180);
      return;
    }

    setDragX(0);
  }

  function handleCardClick(event) {
    if (!draggedRef.current) return;
    event.preventDefault();
    draggedRef.current = false;
  }

  function handleSave(event) {
    event.preventDefault();
    event.stopPropagation();
    setSaved(toggleSavedDeal(userId, deal.id));
  }

  const action = dragX > 24 ? 'save' : dragX < -24 ? 'hide' : '';
  const translateX = leaving === 'right' ? '130%' : leaving === 'left' ? '-130%' : `${dragX}px`;
  const rotate = leaving ? 6 * (leaving === 'right' ? 1 : -1) : dragX / 24;

  return (
    <article className="relative overflow-hidden rounded-2xl bg-white">
      <div aria-hidden="true" className="absolute inset-0 grid grid-cols-2 rounded-2xl border border-[#E5E7EB]">
        <div className={`flex items-center pl-5 text-sm font-black transition-opacity ${action === 'save' ? 'bg-[#EAF7EE] text-[#166534] opacity-100' : 'opacity-0'}`}>
          <span className="mr-2 grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"><HeartMiniIcon filled /></span>
          Save
        </div>
        <div className={`flex items-center justify-end pr-5 text-sm font-black transition-opacity ${action === 'hide' ? 'bg-[#F4F4F5] text-[#B42318] opacity-100' : 'opacity-0'}`}>
          Not interested
          <span className="ml-2 grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"><XMiniIcon /></span>
        </div>
      </div>
      <Link
        to={`/deals/${deal.id}`}
        onClick={handleCardClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative z-10 grid min-h-[124px] touch-pan-y grid-cols-[1fr_96px] gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3.5 shadow-[0_5px_18px_rgba(11,31,58,.07)] ${dragging ? '' : 'transition-transform duration-200 ease-out'}`}
        style={{ transform: `translateX(${translateX}) rotate(${rotate}deg)` }}
      >
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start justify-between gap-3">
            <span className={`rounded-md px-2 py-1 text-[9px] font-black uppercase leading-none text-white ${saleBadgeClass(deal.sale_type)}`}>
              {labelize(deal.sale_type)}
            </span>
            {urgency && <span className="rounded-md bg-[#FFF1E8] px-2 py-1 text-[9px] font-black uppercase leading-none text-deal-orange">{urgency}</span>}
          </div>
          <h2 className="mt-2 line-clamp-2 text-[16px] font-black leading-tight text-app-ink">{deal.title}</h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold leading-tight text-app-text">
            <PinMiniIcon />
            <span className="truncate">{deal.store_name || deal.city}{deal.city ? `, ${deal.city}` : ''}</span>
            <span className="text-[#2563EB]">1.8 km</span>
          </p>
          <p className="mt-2 text-[18px] font-black leading-none text-deal-orange">
            {deal.discount_text || 'Deal details available'}
          </p>
          <p className="mt-2 line-clamp-1 text-[12px] font-medium leading-tight text-app-ink">
            {categoryLine(deal)}
          </p>
          <p className="mt-auto pt-2 text-[11px] font-medium text-app-text">
            <span className="font-semibold text-app-ink">{activeConfirmations} confirmed active</span>
            <span className="px-1.5">·</span>
            {updatedLabel}
          </p>
        </div>

        <div className="flex min-w-0 flex-col items-end">
          <div className="mb-2 flex w-full items-center justify-between gap-2">
            <button onClick={handleSave} aria-label={saved ? 'Remove saved deal' : 'Save deal'} className={`grid h-8 w-8 place-items-center rounded-full border ${saved ? 'border-brand bg-brand text-white' : 'border-stone-200 bg-white text-app-ink'}`}>
              <HeartMiniIcon filled={saved} />
            </button>
            <span className={`rounded-md px-2 py-1 text-[9px] font-bold leading-none ${confidenceClass(confidence)}`}>
              {confidenceLabel(confidence)}
            </span>
          </div>
          <div className="h-[82px] w-full overflow-hidden rounded-xl bg-stone-100">
            {deal.image_url ? (
              <img src={deal.image_url} alt={deal.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-700 to-brand-950 text-sm font-black text-white">
                SALE
              </div>
            )}
          </div>
        </div>
      </Link>
      {deal.status === 'active' && (
        <div className="relative z-10 hidden bg-white px-4 pb-4 sm:block">
          <ConfirmationButtons dealId={deal.id} onConfirmed={onConfirmed} />
        </div>
      )}
    </article>
  );
}

function HeartMiniIcon({ filled }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d="M20 8.5c0 5-8 10.5-8 10.5S4 13.5 4 8.5A4.2 4.2 0 0 1 12 6a4.2 4.2 0 0 1 8 2.5Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XMiniIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function saleBadgeClass(saleType) {
  if (saleType === 'warehouse_sale') return 'bg-[#2563EB]';
  if (saleType === 'clearance') return 'bg-[#16A34A]';
  return 'bg-deal-orange';
}

function confidenceClass(score) {
  if (score >= 80) return 'bg-[#DCFCE7] text-[#166534]';
  if (score >= 60) return 'bg-[#FEF3C7] text-[#92400E]';
  return 'bg-stone-100 text-stone-600';
}

function confidenceLabel(score) {
  if (score >= 80) return 'Verified';
  if (score >= 60) return 'Auto-detected';
  if (score > 0) return 'Check source';
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

function urgencyLabel(deal) {
  if (!deal.created_at) return '';
  const created = new Date(deal.created_at);
  const today = new Date();
  const days = Math.floor((today.setHours(0, 0, 0, 0) - created.setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return 'New today';
  if (deal.expires_at) {
    const expires = new Date(deal.expires_at);
    const daysLeft = Math.ceil((expires - new Date()) / 86400000);
    if (daysLeft >= 0 && daysLeft <= 3) return 'Final days';
  }
  return '';
}
