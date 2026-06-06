import { Link } from 'react-router-dom';

const chips = ['Near me', 'Store Closing', 'Warehouse', 'Clearance', 'Furniture', 'Sports'];

export default function Dashboard() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
      <section className="rounded border border-stone-200 bg-brand-700 px-5 py-6 text-white shadow-sm sm:px-8 sm:py-10">
        <p className="text-sm font-semibold uppercase text-deal-amber">Local deal radar</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Clearance Scout</h1>
        <p className="mt-2 text-lg text-stone-100">Find closing sales near you</p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-200 sm:text-base">
          Find local closing sales, warehouse deals, and clearance events before they disappear.
        </p>

        <div className="mt-5">
          <label className="sr-only" htmlFor="home-search">Search store, category, city</label>
          <input
            id="home-search"
            placeholder="Search store, category, city..."
            className="w-full rounded border border-white/20 bg-white px-4 py-3 text-base text-app-text shadow-sm outline-none"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {chips.map((chip) => (
            <span key={chip} className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link to="/deals?view=map" className="rounded bg-deal-amber px-4 py-3 text-center font-bold text-brand-700">Map View</Link>
          <Link to="/deals" className="rounded bg-white px-4 py-3 text-center font-bold text-brand-700">List View</Link>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric label="Active Deals" value="Live" />
        <Metric label="Community Checks" value="Fast" />
        <Metric label="Source Links" value="Verified" />
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-brand-700">{value}</p>
    </div>
  );
}
