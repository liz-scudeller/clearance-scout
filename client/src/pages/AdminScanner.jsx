import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  classifyNewMentions,
  classifyRawDealMention,
  convertRawDealMention,
  getRawDealMentions,
  ignoreRawDealMention,
  runScanners
} from '../services/api';
import AdminNav from '../components/AdminNav';
import { labelize } from '../utils/options';

const tabs = ['New', 'Classified', 'Converted', 'Ignored', 'Errors'];

export default function AdminScanner() {
  const { mentionId } = useParams();
  const navigate = useNavigate();
  const [mentions, setMentions] = useState([]);
  const [filters, setFilters] = useState({ sourceType: '' });
  const [activeTab, setActiveTab] = useState('New');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [running, setRunning] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [page, setPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const pageSize = 10;

  async function loadData() {
    setMessage('');
    try {
      const mentionData = await getRawDealMentions(mentionId ? {} : filters);
      setMentions(mentionData.mentions || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleRunScanners() {
    setRunning(true);
    try {
      await runScanners();
      await loadData();
      setMessage('Scanner run finished.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setRunning(false);
    }
  }

  async function handleClassifyBatch() {
    setClassifying(true);
    try {
      await classifyNewMentions(20);
      await loadData();
      setMessage('New mentions classified.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setClassifying(false);
    }
  }

  async function handleClassifyOne(id) {
    setActionLoadingId(id);
    setMessage('');

    try {
      await classifyRawDealMention(id);
      await loadData();
      setMessage('Mention classified with AI.');
    } catch (error) {
      setMessage(error.message || 'Failed to classify mention.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleConvert(id) {
    setActionLoadingId(id);
    setMessage('');

    try {
      const result = await convertRawDealMention(id, 'pending');
      await loadData();
      setMessage('Mention converted to pending deal.');
      navigate(`/admin?converted=${result.dealId || id}`);
    } catch (error) {
      setMessage(error.message || 'Failed to convert mention.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleIgnore(id) {
    setActionLoadingId(id);
    setMessage('');

    try {
      await ignoreRawDealMention(id);
      await loadData();
      setMessage('Mention ignored.');
    } catch (error) {
      setMessage(error.message || 'Failed to ignore mention.');
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => { loadData(); }, [mentionId, filters.sourceType]);

  const visibleMentions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mentions.filter((mention) => {
      if (normalizedQuery) {
        const haystack = [
          mention.title,
          mention.snippet,
          mention.city,
          mention.source_type,
          mention.sale_type,
          mention.classification_result?.saleType,
          mention.detected_keywords?.join(' ')
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(normalizedQuery)) return false;
      }

      if (filters.sourceType && mention.source_type !== filters.sourceType) {
        return false;
      }

      if (activeTab === 'Classified') {
        return mention.classification_status === 'classified';
      }

      if (activeTab === 'Converted') {
        return mention.classification_status === 'converted';
      }

      if (activeTab === 'Ignored') {
        return mention.classification_status === 'ignored';
      }

      if (activeTab === 'Errors') {
        return mention.classification_status === 'ai_error';
      }

      return mention.classification_status === 'new';
    });
  }, [mentions, query, activeTab, filters.sourceType]);

  const totalPages = Math.max(1, Math.ceil(visibleMentions.length / pageSize));

  const paginatedMentions = visibleMentions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [query, activeTab, filters.sourceType]);

  const selectedMention = mentionId
    ? mentions.find((mention) => String(mention.id) === String(mentionId))
    : null;

  if (mentionId) {
    return (
      <ScannerDetail
        mention={selectedMention}
        message={message}
        onBack={() => navigate('/admin/scanner')}
        onClassify={handleClassifyOne}
        onConvert={handleConvert}
        onIgnore={handleIgnore}
        loading={actionLoadingId === selectedMention?.id}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F7F2] text-app-ink">
      <section className="mx-auto min-w-0 max-w-6xl px-4 py-8 lg:px-6">
        <p className="text-xs font-semibold uppercase text-deal-amber">Admin</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Scanner Inbox</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
          New mentions found from public sources. Convert useful mentions into pending deals, or ignore noise.
        </p>
        <AdminNav />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-black text-app-ink">Incoming mentions</h2>
            <p className="mt-1 text-sm text-stone-600">Run scanner, classify new mentions, then triage the inbox.</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <button onClick={handleRunScanners} disabled={running} className="h-11 rounded-xl border border-brand bg-white px-4 text-sm font-black text-brand disabled:opacity-50">{running ? 'Running...' : 'Run Scanner'}</button>
            <button onClick={handleClassifyBatch} disabled={classifying} className="h-11 rounded-xl bg-brand px-4 text-sm font-black text-white shadow-sm disabled:opacity-50">{classifying ? 'Classifying...' : 'Classify with AI'}</button>
          </div>
        </div>

        {message && <p className="mt-5 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">{message}</p>}

        <section className="mt-6 min-w-0">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <Filters query={query} setQuery={setQuery} filters={filters} setFilters={setFilters} />
          <MentionsTable
            mentions={paginatedMentions}
            onClassify={handleClassifyOne}
            onConvert={handleConvert}
            onIgnore={handleIgnore}
            actionLoadingId={actionLoadingId}
          />
          <TableFooter
            page={page}
            totalPages={totalPages}
            visibleCount={paginatedMentions.length}
            totalCount={visibleMentions.length}
            onPageChange={setPage}
          />
        </section>
      </section>
    </main>
  );
}


function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex gap-8 border-b border-stone-200">
      {tabs.map((tab) => (
        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-1 pb-5 text-base font-semibold ${activeTab === tab ? 'border-b-4 border-brand text-brand' : 'text-stone-500'}`}>
          {tab}
        </button>
      ))}
    </div>
  );
}

function Filters({ query, setQuery, filters, setFilters }) {
  function clearFilters() {
    setQuery('');
    setFilters({ sourceType: '' });
  }

  return (
    <div className="mt-4 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 rounded-xl border border-stone-200 px-4 text-sm outline-none focus:border-brand"
          placeholder="Search title, city, keyword..."
        />

        <select
          value={filters.sourceType || ''}
          onChange={(event) => setFilters({ ...filters, sourceType: event.target.value })}
          className="h-11 rounded-xl border border-stone-200 px-4 text-sm text-stone-600"
        >
          <option value="">All sources</option>
          <option value="google">Google</option>
          <option value="eventbrite">Eventbrite</option>
          <option value="public_site">Public site</option>
          <option value="manual_test">Manual test</option>
          <option value="other">Other</option>
        </select>

        <button
          type="button"
          onClick={clearFilters}
          className="h-11 rounded-xl border border-stone-200 px-5 text-sm font-black text-app-ink"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function MentionsTable({ mentions, onClassify, onConvert, onIgnore, actionLoadingId }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_92px_76px] border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-black uppercase text-stone-500 md:grid-cols-[minmax(0,1fr)_130px_96px_120px]">
        <span>Mention</span>
        <span>Source</span>
        <span className="hidden md:block">Status</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-stone-200">
        {mentions.map((mention) => (
          <MentionRow
            key={mention.id}
            mention={mention}
            onClassify={onClassify}
            onConvert={onConvert}
            onIgnore={onIgnore}
            loading={actionLoadingId === mention.id}
          />
        ))}

        {!mentions.length && (
          <p className="px-5 py-10 text-center text-sm text-stone-500">
            No mentions match these filters.
          </p>
        )}
      </div>
    </div>
  );
}

function MentionRow({ mention, onClassify, onConvert, onIgnore, loading }) {
  const result = mention.classification_result || {};
  const status = mention.classification_status || 'new';
  const suggestedStatus = result.suggestedStatus || '-';
  const source = labelize(mention.source_type || 'unknown');

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_92px_76px] gap-3 px-4 py-4 hover:bg-stone-50/70 md:grid-cols-[minmax(0,1fr)_130px_96px_120px]">
      <Link to={`/admin/scanner/${mention.id}`} className="min-w-0">
        <p className="line-clamp-2 text-sm font-black leading-5 text-app-ink">
          {mention.title || 'Untitled mention'}
        </p>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          {mention.city && (
            <span className="max-w-full truncate text-xs font-semibold text-stone-500">
              {mention.city}
            </span>
          )}
          {suggestedStatus !== '-' && (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-black text-deal-orange">
              {labelize(suggestedStatus)}
            </span>
          )}
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-black text-stone-600 md:hidden">
            {labelize(status)}
          </span>
        </div>
        {mention.snippet && (
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-stone-500">
            {mention.snippet}
          </p>
        )}
      </Link>

      <div className="min-w-0 text-sm text-stone-600">
        <span className="block truncate">{source}</span>
        <span className="mt-1 block text-xs text-stone-400">{mention.confidence_score || 0}/100</span>
      </div>

      <div className="hidden md:block">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadgeClass(status)}`}>
          {labelize(status)}
        </span>
        <span className="mt-2 block text-xs text-stone-400">{relativeDay(mention.created_at)}</span>
      </div>

      <div className="flex justify-end gap-1.5">
        {status === 'new' || status === 'ai_error' ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => onClassify(mention.id)}
            className="h-8 rounded-md border border-brand px-2 text-xs font-black text-brand disabled:opacity-50"
          >
            AI
          </button>
        ) : null}

        {suggestedStatus === 'pending' || status === 'classified' ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => onConvert(mention.id)}
            className="h-8 rounded-md bg-brand px-2 text-xs font-black text-white disabled:opacity-50"
          >
            OK
          </button>
        ) : null}

        <button
          type="button"
          disabled={loading}
          onClick={() => onIgnore(mention.id)}
          className="h-8 rounded-md border border-red-200 px-2 text-xs font-black text-red-600 disabled:opacity-50"
        >
          X
        </button>
      </div>
    </div>
  );
}

function statusBadgeClass(status) {
  if (status === 'classified') return 'bg-blue-50 text-blue-700';
  if (status === 'converted') return 'bg-green-50 text-green-700';
  if (status === 'ignored') return 'bg-stone-100 text-stone-600';
  if (status === 'ai_error') return 'bg-red-50 text-red-700';
  return 'bg-orange-50 text-deal-orange';
}

function ScannerDetail({ mention, message, onBack, onClassify, onConvert, onIgnore, loading }) {
  const result = mention?.classification_result || {};
  const status = mention?.classification_status || 'new';
  const suggestedStatus = result.suggestedStatus || '-';

  return (
    <main className="min-h-screen bg-[#F8F7F2] text-app-ink">
      <section className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-black text-brand"
        >
          &lt; Back to scanner
        </button>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase text-deal-amber">Scanner mention</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {mention?.title || 'Mention details'}
          </h1>
        </div>

        {message && <p className="mt-5 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">{message}</p>}

        {!mention ? (
          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
            Loading mention...
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadgeClass(status)}`}>
                  {labelize(status)}
                </span>
                {suggestedStatus !== '-' && (
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-deal-orange">
                    AI: {labelize(suggestedStatus)}
                  </span>
                )}
              </div>

              {mention.snippet && (
                <p className="mt-5 leading-7 text-stone-700">
                  {mention.snippet}
                </p>
              )}

              {mention.source_url && (
                <a
                  href={mention.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-block text-sm font-black text-[#2563EB]"
                >
                  Open original source
                </a>
              )}

              <div className="mt-6 grid gap-4 border-t border-stone-200 pt-5 sm:grid-cols-2">
                <DetailLine label="Source" value={labelize(mention.source_type || 'unknown')} />
                <DetailLine label="City" value={mention.city || 'Unknown'} />
                <DetailLine label="Sale type" value={labelize(result.saleType || mention.sale_type || 'unknown')} />
                <DetailLine label="Confidence" value={`${mention.confidence_score || 0} / 100`} />
                <DetailLine label="Added" value={mention.created_at ? new Date(mention.created_at).toLocaleString() : 'Unknown'} />
                <DetailLine label="Keywords" value={mention.detected_keywords?.join(', ') || '-'} />
              </div>
            </section>

            <aside className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black">Review actions</h2>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onClassify(mention.id)}
                  className="h-11 w-full rounded-md border border-brand text-sm font-black text-brand disabled:opacity-50"
                >
                  {loading ? 'Working...' : 'Classify with AI'}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onConvert(mention.id)}
                  className="h-11 w-full rounded-md bg-brand text-sm font-black text-white disabled:opacity-50"
                >
                  Convert to deal
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onIgnore(mention.id)}
                  className="h-11 w-full rounded-md border border-red-200 text-sm font-black text-red-600 disabled:opacity-50"
                >
                  Ignore
                </button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function DetailLine({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-black uppercase text-stone-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-stone-700">{value}</p>
    </div>
  );
}

function TableFooter({ page, totalPages, visibleCount, totalCount, onPageChange }) {
  const start = totalCount === 0 ? 0 : (page - 1) * 10 + 1;
  const end = totalCount === 0 ? 0 : start + visibleCount - 1;

  return (
    <div className="flex flex-col gap-3 border-b border-stone-200 px-1 py-5 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-stone-600">
        Showing {start} to {end} of {totalCount} results
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white text-sm font-black text-app-ink disabled:opacity-40"
        >
          &lt;
        </button>

        <span className="rounded-lg bg-brand px-4 py-2 text-sm font-black text-white">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white text-sm font-black text-app-ink disabled:opacity-40"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

function relativeDay(dateValue) {
  if (!dateValue) return 'Today';
  const date = new Date(dateValue);
  const today = new Date();
  const days = Math.floor((today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString();
}
