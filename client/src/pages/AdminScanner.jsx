import { useEffect, useMemo, useState } from 'react';
import {
  classifyNewMentions,
  classifyRawDealMention,
  convertRawDealMention,
  getRawDealMentions,
  getScannerRuns,
  ignoreRawDealMention,
  runScanners
} from '../services/api';
import { labelize } from '../utils/options';

const navItems = ['Dashboard', 'Deals', 'Raw Mentions', 'Scanner Runs', 'AI Classification', 'Alerts', 'Categories', 'Sources', 'Users', 'Settings'];
const tabs = ['Raw Mentions', 'Pending Review', 'Classified', 'Ignored', 'AI Errors'];

export default function AdminScanner() {
  const [runs, setRuns] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [filters, setFilters] = useState({ status: '', city: '' });
  const [activeTab, setActiveTab] = useState('Raw Mentions');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [running, setRunning] = useState(false);
  const [classifying, setClassifying] = useState(false);

  async function loadData() {
    setMessage('');
    try {
      const [runData, mentionData] = await Promise.all([getScannerRuns(), getRawDealMentions(filters)]);
      setRuns(runData.runs || []);
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
    await classifyRawDealMention(id);
    await loadData();
  }

  async function handleConvert(id) {
    await convertRawDealMention(id, 'pending');
    await loadData();
  }

  async function handleIgnore(id) {
    await ignoreRawDealMention(id);
    await loadData();
  }

  useEffect(() => { loadData(); }, [filters.status, filters.city]);

  const visibleMentions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return mentions.filter((mention) => {
      if (normalizedQuery) {
        const haystack = [mention.title, mention.snippet, mention.city, mention.source_type, mention.detected_keywords?.join(' ')].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      if (activeTab === 'Pending Review') return mention.classification_result?.suggestedStatus === 'pending';
      if (activeTab === 'Classified') return mention.classification_status === 'classified';
      if (activeTab === 'Ignored') return mention.classification_status === 'ignored';
      if (activeTab === 'AI Errors') return mention.classification_status === 'ai_error';
      return true;
    });
  }, [mentions, query, activeTab]);

  const stats = useMemo(() => ({
    newMentions: mentions.filter((item) => item.classification_status === 'new').length,
    pending: mentions.filter((item) => item.classification_result?.suggestedStatus === 'pending').length,
    active: mentions.filter((item) => item.classification_result?.suggestedStatus === 'active').length,
    expiredSoon: mentions.filter((item) => item.classification_result?.expiresAt).length,
    ignored: mentions.filter((item) => item.classification_status === 'ignored').length,
    autoApproved: mentions.filter((item) => (item.confidence_score || 0) >= 80).length,
    runs: runs.length
  }), [mentions, runs]);

  return (
    <main className="min-h-screen bg-white text-app-ink md:grid md:grid-cols-[300px_1fr]">
      <AdminSidebar />

      <section className="min-w-0 px-6 py-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight">Scanner & AI Dashboard</h1>
          <div className="flex gap-3">
            <button onClick={handleRunScanners} disabled={running} className="h-14 rounded-md border border-brand bg-white px-8 text-base font-black text-brand disabled:opacity-50">{running ? 'Running...' : 'Run Scanner'}</button>
            <button onClick={handleClassifyBatch} disabled={classifying} className="h-14 rounded-md bg-brand px-8 text-base font-black text-white shadow-sm disabled:opacity-50">{classifying ? 'Classifying...' : 'Classify New Mentions'}</button>
          </div>
        </div>

        {message && <p className="mt-5 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">{message}</p>}

        <section className="mt-8 grid gap-6 xl:grid-cols-5">
          <MetricCard label="New Mentions" value={stats.newMentions} note="Needs classification" />
          <MetricCard label="Pending Review" value={stats.pending} note="AI suggested review" tone="orange" />
          <MetricCard label="Active Deals" value={stats.active} note="Live and confirmed" tone="green" />
          <MetricCard label="Expired Soon" value={stats.expiredSoon} note="Ending in 7 days" tone="red" />
          <MetricCard label="Scanner Runs" value={stats.runs} note="Last 7 days" />
        </section>

        <section className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_256px]">
          <div className="min-w-0">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <Filters query={query} setQuery={setQuery} filters={filters} setFilters={setFilters} />
            <MentionsTable mentions={visibleMentions.slice(0, 6)} onClassify={handleClassifyOne} onConvert={handleConvert} onIgnore={handleIgnore} />
            <TableFooter visibleCount={Math.min(visibleMentions.length, 6)} totalCount={visibleMentions.length} />
            <ActionGuide />
          </div>

          <aside className="space-y-6">
            <AiSummary stats={stats} />
            <RecentRun run={runs[0]} />
          </aside>
        </section>
      </section>
    </main>
  );
}

function AdminSidebar() {
  return (
    <aside className="hidden min-h-screen flex-col bg-brand p-7 text-white shadow-2xl md:flex">
      <div className="flex items-center gap-3 text-2xl font-black">
        <MapMarkerIcon />
        Clearance Scout
      </div>

      <nav className="mt-12 space-y-3">
        {navItems.map((item) => (
          <button key={item} className={`flex h-14 w-full items-center gap-4 rounded-lg px-4 text-left text-lg font-semibold ${item === 'Raw Mentions' ? 'bg-black/18 text-white shadow-inner' : 'text-white/90 hover:bg-white/10'}`}>
            <SidebarIcon />
            {item}
          </button>
        ))}
      </nav>

      <button className="mt-auto flex items-center gap-4 px-4 py-3 text-lg font-semibold text-white/90">
        <SidebarIcon />
        Logout
      </button>
    </aside>
  );
}

function MetricCard({ label, value, note, tone = 'dark' }) {
  const colors = {
    dark: 'text-app-ink',
    orange: 'text-deal-orange',
    green: 'text-deal-green',
    red: 'text-red-700'
  };
  return (
    <div className="min-h-36 rounded-lg border border-stone-200 bg-white p-7 shadow-sm">
      <p className="text-lg font-black">{label}</p>
      <p className={`mt-5 text-4xl font-black ${colors[tone]}`}>{value}</p>
      <p className="mt-3 text-base text-stone-500">{note}</p>
    </div>
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
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
      <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 rounded-md border border-stone-200 px-4 text-base outline-none focus:border-brand" placeholder="Search mentions..." />
      <select className="h-12 rounded-md border border-stone-200 px-4 text-base text-stone-600"><option>All sources</option></select>
      <input value={filters.city || ''} onChange={(event) => setFilters({ ...filters, city: event.target.value })} className="h-12 rounded-md border border-stone-200 px-4 text-base outline-none focus:border-brand" placeholder="All cities" />
      <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="h-12 rounded-md border border-stone-200 px-4 text-base text-stone-600">
        <option value="">All statuses</option>
        <option value="new">New</option>
        <option value="classified">Classified</option>
        <option value="converted">Converted</option>
        <option value="ignored">Ignored</option>
        <option value="ai_error">AI Errors</option>
      </select>
      <select className="h-12 rounded-md border border-stone-200 px-4 text-base text-stone-600"><option>All sale types</option></select>
      <button className="h-12 rounded-md border border-stone-200 px-5 text-base font-black text-app-ink">Filters</button>
    </div>
  );
}

function MentionsTable({ mentions, onClassify, onConvert, onIgnore }) {
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-white text-sm text-stone-500">
            <tr className="border-b border-stone-200">
              <th className="px-5 py-5 font-semibold">Title</th>
              <th className="px-4 py-5 font-semibold">Source</th>
              <th className="px-4 py-5 font-semibold">City</th>
              <th className="px-4 py-5 font-semibold">Keywords</th>
              <th className="px-4 py-5 font-semibold">AI Confidence</th>
              <th className="px-4 py-5 font-semibold">AI Suggested</th>
              <th className="px-4 py-5 font-semibold">Status</th>
              <th className="px-4 py-5 font-semibold">Added</th>
              <th className="px-4 py-5 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {mentions.map((mention) => <MentionRow key={mention.id} mention={mention} onClassify={onClassify} onConvert={onConvert} onIgnore={onIgnore} />)}
            {!mentions.length && (
              <tr><td className="px-5 py-8 text-stone-500" colSpan="9">No mentions match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MentionRow({ mention, onClassify, onConvert, onIgnore }) {
  const result = mention.classification_result || {};
  return (
    <tr className="align-middle">
      <td className="max-w-[260px] px-5 py-5 font-black text-app-ink">{mention.title}</td>
      <td className="px-4 py-5 text-stone-600">{labelize(mention.source_type)}</td>
      <td className="px-4 py-5 text-stone-600">{mention.city || 'Unknown'}</td>
      <td className="max-w-[190px] px-4 py-5 text-stone-600">{mention.detected_keywords?.join(', ') || '-'}</td>
      <td className="px-4 py-5 text-stone-700">{mention.confidence_score || 0}</td>
      <td className={`px-4 py-5 ${result.suggestedStatus === 'pending' ? 'text-deal-orange' : 'text-stone-700'}`}>{result.suggestedStatus ? labelize(result.suggestedStatus) : '-'}</td>
      <td className="px-4 py-5"><span className="rounded bg-[#E1F3EA] px-3 py-1 text-sm font-semibold text-brand">{labelize(mention.classification_status)}</span></td>
      <td className="px-4 py-5 text-stone-600">{relativeDay(mention.created_at)}</td>
      <td className="px-4 py-5">
        <div className="flex justify-center gap-5 text-lg">
          <button onClick={() => onClassify(mention.id)} className="text-brand" title="Classify with AI">View</button>
          <button onClick={() => onConvert(mention.id)} className="font-black text-green-700" title="Convert to deal">OK</button>
          <button onClick={() => onIgnore(mention.id)} className="font-black text-red-600" title="Ignore">X</button>
        </div>
      </td>
    </tr>
  );
}

function TableFooter({ visibleCount, totalCount }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-200 px-1 py-7">
      <p className="text-base text-stone-600">Showing 1 to {visibleCount} of {totalCount} results</p>
      <div className="flex gap-2">
        {['<', '1', '2', '3', '>'].map((item) => (
          <button key={item} className={`grid h-10 w-10 place-items-center rounded-md border text-base font-semibold ${item === '1' ? 'border-brand bg-brand text-white' : 'border-stone-200 bg-white text-app-ink'}`}>{item}</button>
        ))}
      </div>
    </div>
  );
}

function ActionGuide() {
  return (
    <div className="grid gap-5 py-8 md:grid-cols-4">
      <Guide label="Classify with AI" note="Analyze with AI" tone="green" />
      <Guide label="Convert to Deal" note="Create deal from mention" tone="green" />
      <Guide label="Ignore" note="Mark as not relevant" tone="red" />
      <Guide label="View Source" note="Open original source" tone="dark" />
    </div>
  );
}

function Guide({ label, note, tone }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-brand' : 'text-app-ink';
  return (
    <div className="flex items-start gap-4">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${color}`}>i</span>
      <div>
        <p className="text-base font-black text-app-ink">{label}</p>
        <p className="mt-1 text-sm text-stone-500">{note}</p>
      </div>
    </div>
  );
}

function AiSummary({ stats }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black">AI Summary</h2>
      <p className="mt-4 text-sm leading-6 text-stone-500">AI is helping you find the best deals automatically.</p>
      <div className="mt-6 rounded-lg border border-stone-200 p-5">
        <SummaryLine label="Auto Approved" value={stats.autoApproved} note="High confidence deals" />
        <SummaryLine label="Pending Review" value={stats.pending} note="Needs your review" />
        <SummaryLine label="Ignored" value={stats.ignored} note="Not relevant" />
      </div>
    </div>
  );
}

function SummaryLine({ label, value, note }) {
  return (
    <div className="mb-7 last:mb-0">
      <p className="text-sm font-black">{label}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{note}</p>
    </div>
  );
}

function RecentRun({ run }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black">Recent Scanner Run</h2>
      {run ? (
        <div className="mt-5 space-y-3 text-sm">
          <p className="font-black">{labelize(run.scanner_name)} Scanner</p>
          <p className="text-stone-500">{new Date(run.started_at).toLocaleString()}</p>
          <p><span className="font-black">Found:</span> {run.results_found}</p>
          <p><span className="font-black">Saved:</span> {run.results_saved}</p>
          {run.error_message && <p className="text-red-600">{run.error_message}</p>}
        </div>
      ) : <p className="mt-5 text-sm text-stone-500">No runs yet.</p>}
      <button className="mt-6 h-12 rounded-md border border-brand px-5 text-base font-black text-brand">View All Runs</button>
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

function MapMarkerIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-5.2 7-12A7 7 0 0 0 5 9c0 6.8 7 12 7 12Z" stroke="currentColor" strokeWidth="2.5" />
      <path d="M12 12.2A3.2 3.2 0 1 0 12 5.8a3.2 3.2 0 0 0 0 6.4Z" fill="currentColor" />
    </svg>
  );
}

function SidebarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M5 6h14M5 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
