import { labelize } from '../utils/options';

export default function AdminDealTable({ deals, onStatusChange }) {
  if (!deals.length) {
    return <p className="rounded border border-stone-200 bg-white p-4 text-sm text-stone-600">No pending deals.</p>;
  }

  return (
    <section className="space-y-4">
      {deals.map((deal) => (
        <AdminDealCard key={deal.id} deal={deal} onStatusChange={onStatusChange} />
      ))}
    </section>
  );
}

function AdminDealCard({ deal, onStatusChange }) {
  const rawMention = deal.raw_deal_mentions;
  const aiResult = rawMention?.classification_result || {};
  const sourceUrl = deal.source_url || rawMention?.source_url;
  const originLabel = getOriginLabel(deal);
  const reporter = deal.profiles?.email || deal.profiles?.full_name || null;
  const needsSourceLink = !deal.reported_by && (deal.detection_method === 'automated_ai' || deal.detection_method === 'scanner');
  const canApprove = !needsSourceLink || Boolean(sourceUrl);

  return (
    <article className="rounded border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-mint">{originLabel}</p>
          <h2 className="text-xl font-bold text-ink">{deal.title}</h2>
          <p className="text-sm text-stone-600">{deal.store_name} - {deal.city}</p>
        </div>
        <span className="rounded bg-[#fff3d8] px-2 py-1 text-xs font-semibold text-ink">
          Pending Review
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <Info label="Sale Type" value={labelize(deal.sale_type)} />
        <Info label="Category" value={labelize(deal.category)} />
        <Info label="Discount" value={deal.discount_text} />
        <Info label="Address" value={`${deal.address}, ${deal.city}, ${deal.province}`} />
        <Info label="Submitted" value={new Date(deal.created_at).toLocaleString()} />
        <Info label="Source Confidence" value={`${deal.ai_confidence_score || deal.source_confidence || rawMention?.confidence_score || 0}/100`} />
        <Info label="Reporter" value={reporter || 'Automated scanner'} />
        <Info label="Source Type" value={labelize(rawMention?.source_type || deal.source_type || 'unknown')} />
      </div>

      <section className="mt-4 rounded bg-stone-50 p-3">
        <h3 className="text-sm font-bold text-ink">Verification Evidence</h3>
        <div className="mt-2 grid gap-2 text-sm text-stone-700">
          <p>
            <span className="font-semibold">Source link:</span>{' '}
            {sourceUrl ? (
              <a className="font-semibold text-ink underline" href={sourceUrl} target="_blank" rel="noreferrer">{sourceUrl}</a>
            ) : (
              <span className="text-red-700">Missing - required before approving automated deals</span>
            )}
          </p>
          <p><span className="font-semibold">People confirmations:</span> {deal.active_confirmation_count || 0} still active - {deal.expired_confirmation_count || 0} expired reports - {deal.unique_confirmation_users || 0} users</p>
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
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={!canApprove}
          title={canApprove ? 'Approve deal' : 'Automated deals need a source link before approval'}
          onClick={() => onStatusChange(deal.id, 'active')}
          className="rounded bg-mint px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve
        </button>
        <button onClick={() => onStatusChange(deal.id, 'rejected')} className="rounded bg-stone-200 px-3 py-2 font-semibold text-ink">Reject</button>
        <button onClick={() => onStatusChange(deal.id, 'expired')} className="rounded bg-citrus px-3 py-2 font-semibold text-ink">Mark Expired</button>
      </div>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
      <p className="text-stone-800">{value || 'Not provided'}</p>
    </div>
  );
}

function getOriginLabel(deal) {
  if (deal.reported_by) return 'User Report';
  if (deal.detection_method === 'automated_ai') return 'AI Scanner';
  if (deal.detection_method === 'scanner') return 'Scanner';
  return labelize(deal.detection_method || 'Unknown Origin');
}
