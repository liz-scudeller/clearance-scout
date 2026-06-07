import { useState } from 'react';
import { labelize } from '../utils/options';

export default function AdminDealTable({ deals, onStatusChange, onDelete, onSaveDeal, actionLoadingId }) {
  if (!deals.length) {
    return <p className="rounded border border-stone-200 bg-white p-4 text-sm text-stone-600">No pending deals.</p>;
  }

  return (
    <section className="space-y-4">
      {deals.map((deal) => (
        <AdminDealCard
          key={deal.id}
          deal={deal}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onSaveDeal={onSaveDeal}
          loading={actionLoadingId === deal.id}
        />
      ))}
    </section>
  );
}

function AdminDealCard({ deal, onStatusChange, onDelete, onSaveDeal, loading }) {
  const rawMention = deal.raw_deal_mentions;
  const aiResult = rawMention?.classification_result || {};
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => dealToDraft(deal));
  const sourceUrl = deal.source_url || rawMention?.source_url;
  const originLabel = getOriginLabel(deal);
  const reporter = deal.profiles?.full_name || deal.profiles?.email || null;
  const sourceLabel = getSourceLabel(deal, rawMention);
  const aiAssessment = getAiAssessment(aiResult);
  const needsSourceLink = !deal.reported_by && (deal.detection_method === 'automated_ai' || deal.detection_method === 'scanner');
  const canApprove = !needsSourceLink || Boolean(sourceUrl);
  const duplicateHints = aiResult.possibleDuplicateHints || [];
  const duplicate = aiResult.duplicate;

  function handleDelete() {
    const confirmed = window.confirm(`Delete "${deal.title}"? This cannot be undone.`);
    if (confirmed) onDelete?.(deal.id);
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    await onSaveDeal?.(deal.id, draft);
    setEditing(false);
  }

  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-mint">{originLabel}</p>
          <h2 className="mt-1 text-xl font-black leading-6 text-ink">{deal.title}</h2>
          <p className="mt-1 text-sm text-stone-600">{deal.store_name}, {deal.city}</p>
          <p className="mt-2 text-sm font-semibold text-stone-700">{deal.discount_text || 'Discount details needed'}</p>
          {aiAssessment && (
            <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
              AI: {aiAssessment}
            </p>
          )}
        </div>
        <span className="rounded bg-[#fff3d8] px-2 py-1 text-xs font-semibold text-ink">
          Pending
        </span>
      </div>

      {duplicateHints.length > 0 || duplicate ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-black">Possible duplicate</p>
          {duplicate?.reason && <p className="mt-1">{duplicate.reason}</p>}
          {duplicateHints.length > 0 && <p className="mt-1">Hints: {duplicateHints.slice(0, 3).join(', ')}</p>}
        </div>
      ) : null}

      {editing ? (
        <EditDealForm draft={draft} updateDraft={updateDraft} />
      ) : (
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Came from" value={deal.reported_by ? `User: ${reporter || 'Unknown user'}` : sourceLabel} />
          <Info label="Source" value={sourceUrl ? shortUrl(sourceUrl) : 'Missing source'} tone={sourceUrl ? 'default' : 'danger'} />
          <Info label="Source date" value={formatSourceDate(deal.source_published_at || rawMention?.source_published_at)} tone={(deal.source_published_at || rawMention?.source_published_at) ? 'default' : 'danger'} />
          <Info label="Sale type" value={labelize(deal.sale_type)} />
        </div>
      )}

      <details className="mt-4 rounded-lg bg-stone-50 p-3">
        <summary className="cursor-pointer text-sm font-bold text-ink">Details and evidence</summary>
        <div className="mt-2 grid gap-2 text-sm text-stone-700">
          <p>
            <span className="font-semibold">Source link:</span>{' '}
            {sourceUrl ? (
              <a className="font-semibold text-ink underline" href={sourceUrl} target="_blank" rel="noreferrer">{sourceUrl}</a>
            ) : (
              <span className="text-red-700">Missing - required before approving automated deals</span>
            )}
          </p>
          <p><span className="font-semibold">Origin:</span> {deal.reported_by ? `Submitted by ${reporter || 'unknown user'}` : sourceLabel}</p>
          <p><span className="font-semibold">Source date:</span> {formatSourceDate(deal.source_published_at || rawMention?.source_published_at)}</p>
          <p><span className="font-semibold">People confirmations:</span> {deal.active_confirmation_count || 0} still active - {deal.expired_confirmation_count || 0} expired reports - {deal.unique_confirmation_users || 0} users</p>
          {aiAssessment && <p><span className="font-semibold">AI assessment:</span> {aiAssessment}</p>}
          {aiResult.userFacingSummary && <p><span className="font-semibold">AI summary:</span> {aiResult.userFacingSummary}</p>}
          {aiResult.adminNotes && <p><span className="font-semibold">Admin notes:</span> {aiResult.adminNotes}</p>}
          {rawMention?.snippet && <p><span className="font-semibold">Raw snippet:</span> {rawMention.snippet}</p>}
          {rawMention?.detected_keywords?.length > 0 && <p><span className="font-semibold">Detected keywords:</span> {rawMention.detected_keywords.join(', ')}</p>}
        </div>
        {sourceUrl && (
          <a className="mt-3 inline-block rounded bg-white px-3 py-2 text-sm font-semibold text-ink underline" href={sourceUrl} target="_blank" rel="noreferrer">
            Open Source Link
          </a>
        )}
      </details>

      <div className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button disabled={loading} onClick={handleSave} className="rounded bg-brand px-3 py-2 font-semibold text-white disabled:opacity-50">Save edits</button>
            <button disabled={loading} onClick={() => { setDraft(dealToDraft(deal)); setEditing(false); }} className="rounded bg-stone-200 px-3 py-2 font-semibold text-ink disabled:opacity-50">Cancel</button>
          </>
        ) : (
          <button disabled={loading} onClick={() => setEditing(true)} className="rounded border border-brand bg-white px-3 py-2 font-semibold text-brand disabled:opacity-50">Edit</button>
        )}
        <button
          disabled={!canApprove || loading}
          title={canApprove ? 'Approve deal' : 'Automated deals need a source link before approval'}
          onClick={() => onStatusChange(deal.id, 'active')}
          className="rounded bg-mint px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve
        </button>
        <button disabled={loading} onClick={() => onStatusChange(deal.id, 'rejected')} className="rounded bg-stone-200 px-3 py-2 font-semibold text-ink disabled:opacity-50">Reject</button>
        <button disabled={loading} onClick={handleDelete} className="rounded border border-red-200 bg-white px-3 py-2 font-semibold text-red-700 disabled:opacity-50">Delete</button>
      </div>
    </article>
  );
}

function EditDealForm({ draft, updateDraft }) {
  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm md:grid-cols-2">
      <Field label="Title" value={draft.title} onChange={(value) => updateDraft('title', value)} />
      <Field label="Store" value={draft.storeName} onChange={(value) => updateDraft('storeName', value)} />
      <Field label="Address" value={draft.address} onChange={(value) => updateDraft('address', value)} />
      <Field label="City" value={draft.city} onChange={(value) => updateDraft('city', value)} />
      <Field label="Province" value={draft.province} onChange={(value) => updateDraft('province', value.toUpperCase())} />
      <Field label="Discount" value={draft.discountText} onChange={(value) => updateDraft('discountText', value)} />
      <Field label="Category" value={draft.category} onChange={(value) => updateDraft('category', value)} />
      <Field label="Sale type" value={draft.saleType} onChange={(value) => updateDraft('saleType', value)} />
      <Field label="Source URL" value={draft.sourceUrl} onChange={(value) => updateDraft('sourceUrl', value)} className="md:col-span-2" />
      <label className="block md:col-span-2">
        <span className="text-xs font-semibold uppercase text-stone-500">Description</span>
        <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} className="mt-1 min-h-24 w-full rounded border border-stone-200 px-3 py-2 text-stone-800 outline-none focus:border-brand" />
      </label>
    </div>
  );
}

function Field({ label, value, onChange, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold uppercase text-stone-500">{label}</span>
      <input value={value || ''} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded border border-stone-200 px-3 text-stone-800 outline-none focus:border-brand" />
    </label>
  );
}

function dealToDraft(deal) {
  return {
    title: deal.title || '',
    storeName: deal.store_name || '',
    address: deal.address || '',
    city: deal.city || '',
    province: deal.province || 'BC',
    category: deal.category || 'other',
    saleType: deal.sale_type || 'other',
    discountText: deal.discount_text || '',
    description: deal.description || '',
    sourceType: deal.source_type || 'other',
    sourceUrl: deal.source_url || '',
    imageUrl: deal.image_url || ''
  };
}

function Info({ label, value, tone = 'default' }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
      <p className={tone === 'danger' ? 'font-semibold text-red-700' : 'text-stone-800'}>{value || 'Not provided'}</p>
    </div>
  );
}

function getOriginLabel(deal) {
  if (deal.reported_by) return 'User Report';
  if (deal.detection_method === 'scanner') return 'Internal Search';
  if (deal.detection_method === 'automated_ai') return 'AI Scanner';
  return labelize(deal.detection_method || 'Unknown Origin');
}

function getSourceLabel(deal, rawMention) {
  const sourceType = rawMention?.source_type || deal.source_type || '';
  const sourceUrl = deal.source_url || rawMention?.source_url || '';
  const sourceName = rawMention?.deal_sources?.name;
  const text = `${sourceType} ${sourceUrl}`.toLowerCase();

  if (sourceName) return sourceName;
  if (text.includes('google') || sourceType === 'search') return 'Google Search';
  if (text.includes('eventbrite')) return 'Eventbrite';
  if (deal.detection_method === 'automated_ai') return 'AI scanner';
  if (deal.detection_method === 'scanner') return 'Public search';
  return labelize(sourceType || deal.detection_method || 'Unknown source');
}

function getAiAssessment(aiResult = {}) {
  if (aiResult.relevanceReason) return aiResult.relevanceReason;
  if (aiResult.adminNotes) return aiResult.adminNotes;
  if (aiResult.userFacingSummary) return aiResult.userFacingSummary;
  if (typeof aiResult.confidenceScore === 'number') return `Confidence ${aiResult.confidenceScore}/100`;
  return '';
}

function shortUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value;
  }
}

function formatSourceDate(value) {
  if (!value) return 'Missing';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
