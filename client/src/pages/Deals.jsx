import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import DealCard from '../components/DealCard';
import { getDeals } from '../services/api';

const quickChips = [
  { label: 'Near me', value: {} },
  { label: 'Store Closing', value: { saleType: 'store_closing' } },
  { label: 'Warehouse', value: { saleType: 'warehouse_sale' } },
  { label: 'Clearance', value: { saleType: 'clearance' } },
  { label: 'Furniture', value: { category: 'furniture' } },
  { label: 'Sports', value: { category: 'sports' } },
  { label: 'Electronics', value: { category: 'electronics' } },
  { label: 'Baby', value: { category: 'baby' } },
  { label: 'More', value: {} }
];

const mapPinColors = {
  warehouse_sale: '#2563EB',
  clearance: '#166534',
  relocation_sale: '#7E22CE',
  default: '#F45113'
};

export default function Deals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({ status: 'active' });
  const [search, setSearch] = useState('');
  const [view, setView] = useState(searchParams.get('view') === 'map' ? 'map' : 'list');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDeals() {
    setLoading(true);
    setError('');
    try {
      const data = await getDeals(filters);
      setDeals(data.deals || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDeals(); }, [filters.city, filters.category, filters.saleType, filters.status]);

  useEffect(() => {
    setView(searchParams.get('view') === 'map' ? 'map' : 'list');
  }, [searchParams]);

  const visibleDeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return deals;
    return deals.filter((deal) => [deal.title, deal.store_name, deal.city, deal.category, deal.sale_type].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [deals, search]);

  function applyChip(chip) {
    setFilters({ status: 'active', ...chip.value });
  }

  function changeView(nextView) {
    setView(nextView);
    if (nextView === 'map') {
      setSearchParams({ view: 'map' });
    } else {
      setSearchParams({});
    }
  }

  if (view === 'map') {
    return (
      <MapScreen
        deals={visibleDeals}
        loading={loading}
        error={error}
        search={search}
        setSearch={setSearch}
        setView={changeView}
      />
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-24 pt-5 md:max-w-6xl md:px-4 md:pb-8 md:pt-8">
      <section className="md:hidden">
        <div className="relative text-center">
          <button aria-label="Open menu" className="absolute left-0 top-7 grid h-11 w-11 place-items-center rounded-full text-brand-950">
            <MenuIcon />
          </button>
          <button aria-label="Open alerts" className="absolute right-0 top-7 grid h-11 w-11 place-items-center rounded-full text-brand-950">
            <BellIcon />
          </button>
          <div className="mx-auto grid h-18 w-20 place-items-center">
            <div className="relative h-11 w-11 rounded-full border-[8px] border-brand">
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" />
              <span className="absolute bottom-[-15px] left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 rounded-br-sm bg-brand" />
            </div>
          </div>
          <h1 className="text-[36px] font-black leading-none text-brand">Clearance Scout</h1>
          <p className="mt-2 text-base font-medium text-stone-600">Find closing sales near you</p>
        </div>
      </section>

      <section className="mt-6 md:mt-0">
        <div className="hidden md:block">
          <p className="text-xs font-semibold uppercase text-deal-amber">Clearance Scout</p>
          <h1 className="mt-1 text-3xl font-black text-brand-700">Find closing sales near you</h1>
        </div>
        <label className="relative mt-5 block">
          <span className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-stone-500 after:absolute after:-bottom-1 after:-right-1 after:h-2 after:w-2 after:rotate-45 after:border-r-2 after:border-stone-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search store, category, city..."
            className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-12 pr-4 text-base font-medium text-app-text shadow-[0_6px_18px_rgba(0,0,0,.07)] outline-none placeholder:text-stone-500 focus:border-brand"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-x-2 gap-y-3">
          {quickChips.map((chip, index) => {
            const active = index === 0 || Object.entries(chip.value).some(([key, value]) => filters[key] === value);
            return (
              <button
                key={chip.label}
                onClick={() => applyChip(chip)}
                className={`h-9 rounded-full border px-4 text-xs font-bold shadow-sm ${active ? 'border-brand bg-brand text-white' : 'border-stone-200 bg-[#FBF7F3] text-app-ink'}`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => changeView('map')} className={`h-12 rounded-xl border text-base font-black shadow-sm ${view === 'map' ? 'border-brand bg-brand text-white' : 'border-stone-200 bg-[#FBF7F3] text-app-ink'}`}>Map View</button>
          <button onClick={() => changeView('list')} className={`h-12 rounded-xl border text-base font-black shadow-sm ${view === 'list' ? 'border-brand bg-brand text-white' : 'border-stone-200 bg-[#FBF7F3] text-app-ink'}`}>List View</button>
        </div>
      </section>

      {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-stone-600">Loading deals...</p>
      ) : (
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-app-ink">Nearby Deals</h2>
            <button className="text-sm font-semibold text-app-text">
              Sort: <span className="font-black text-brand">Nearest</span>
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleDeals.map((deal) => <DealCard key={deal.id} deal={deal} onConfirmed={loadDeals} />)}
          </div>
          {!visibleDeals.length && <p className="text-sm text-stone-600">No deals match these filters.</p>}
        </section>
      )}
    </main>
  );
}

function MapScreen({ deals, loading, error, search, setSearch, setView }) {
  const mapRef = useRef(null);
  const mapNodeRef = useRef(null);
  const markerLayerRef = useRef(null);
  const [selectedDeal, setSelectedDeal] = useState(deals[0] || null);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const map = L.map(mapNodeRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([49.245, -122.98], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true
    }).addTo(map);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!deals.length) return;
    setSelectedDeal((current) => current || deals[0]);
  }, [deals]);

  useEffect(() => {
    const layer = markerLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    const bounds = [];
    deals.slice(0, 60).forEach((deal, index) => {
      const coords = dealCoords(deal, index);
      bounds.push(coords);
      const marker = L.marker(coords, { icon: dealIcon(deal.sale_type) });
      marker.on('click', () => setSelectedDeal(deal));
      marker.addTo(layer);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { paddingTopLeft: [40, 110], paddingBottomRight: [40, 260], maxZoom: 13 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    }
  }, [deals]);

  function useMyLocation() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = [position.coords.latitude, position.coords.longitude];
      mapRef.current.setView(coords, 14);
      L.circleMarker(coords, {
        radius: 8,
        color: '#ffffff',
        weight: 4,
        fillColor: '#2F80ED',
        fillOpacity: 1
      }).addTo(mapRef.current);
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#E5F0DF] pb-24 md:mx-auto md:max-w-6xl md:px-4 md:py-8">
      <section className="relative h-[calc(100vh-96px)] min-h-[620px] overflow-hidden md:h-[760px] md:rounded-[32px] md:border md:border-stone-200 md:shadow-2xl">
        <div ref={mapNodeRef} className="absolute inset-0 z-0" />

        <div className="absolute left-5 right-5 top-14 z-20 flex items-center gap-4 md:left-12 md:right-12">
          <label className="relative block flex-1">
            <span className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-app-ink after:absolute after:-bottom-1 after:-right-1 after:h-2 after:w-2 after:rotate-45 after:border-r-2 after:border-app-ink" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this area"
              className="h-16 w-full rounded-[22px] border border-white/70 bg-white/95 pl-14 pr-4 text-xl font-medium text-app-text shadow-[0_10px_30px_rgba(0,0,0,.12)] outline-none placeholder:text-stone-500"
            />
          </label>
          <button aria-label="Filters" className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-app-ink shadow-[0_10px_30px_rgba(0,0,0,.12)]">
            <SlidersIcon />
          </button>
        </div>

        <button onClick={useMyLocation} aria-label="Use my location" className="absolute bottom-[232px] right-5 z-20 grid h-16 w-16 place-items-center rounded-full bg-white text-app-ink shadow-[0_10px_30px_rgba(0,0,0,.15)]">
          <LocationArrowIcon />
        </button>

        {error && <p className="absolute left-5 right-5 top-36 z-30 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {loading && <p className="absolute left-5 right-5 top-36 z-30 rounded-xl bg-white px-3 py-2 text-sm font-bold text-brand-700 shadow">Loading map deals...</p>}

        {selectedDeal && <MapDealCard deal={selectedDeal} setView={setView} />}
      </section>
    </main>
  );
}

function MapDealCard({ deal, setView }) {
  return (
    <article className="absolute bottom-5 left-5 right-5 z-30 rounded-[24px] bg-white p-4 shadow-[0_15px_40px_rgba(0,0,0,.18)] md:left-12 md:right-12">
      <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-stone-300" />
      <div className="mt-3 grid grid-cols-[1fr_124px] gap-3">
        <div>
          <span className="rounded-md bg-[#FF6B0A] px-3 py-2 text-xs font-black uppercase text-white">Store Closing</span>
          <h2 className="mt-4 line-clamp-2 text-2xl font-black leading-tight text-app-ink">{deal.title}</h2>
          <p className="mt-3 line-clamp-2 text-base font-medium text-app-text">{deal.store_name || 'Local source'}, {deal.city}</p>
          <p className="mt-4 text-2xl font-black text-deal-orange">
            {deal.discount_text || 'Deal details'} <span className="text-base font-semibold text-app-text">- 1.8 km away</span>
          </p>
        </div>
        <div className="mt-5 h-32 overflow-hidden rounded-xl bg-stone-100">
          {deal.image_url ? (
            <img src={deal.image_url} alt={deal.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-700 to-brand-950 text-sm font-black text-white">SALE</div>
          )}
        </div>
      </div>
      <Link to={`/deals/${deal.id}`} className="mt-5 block rounded-xl bg-brand px-4 py-4 text-center text-xl font-black text-white shadow-sm">
        View Details
      </Link>
      <button onClick={() => setView('list')} className="sr-only">Back to List</button>
    </article>
  );
}

function dealCoords(deal, index) {
  const cityCoords = {
    burnaby: [49.2488, -122.9805],
    vancouver: [49.2827, -123.1207],
    coquitlam: [49.2838, -122.7932],
    surrey: [49.1913, -122.849],
    richmond: [49.1666, -123.1336],
    langley: [49.1044, -122.6604],
    delta: [49.0847, -123.0586],
    'new westminster': [49.2057, -122.911],
    'north vancouver': [49.3208, -123.0739],
    'west vancouver': [49.3286, -123.1602]
  };
  const key = String(deal.city || '').trim().toLowerCase();
  const base = cityCoords[key] || cityCoords.burnaby;
  const seed = hashString(`${deal.id || deal.title || index}`);
  const latOffset = (((seed % 100) - 50) / 10000) * 5;
  const lngOffset = ((((seed / 100) % 100) - 50) / 10000) * 5;
  return [base[0] + latOffset, base[1] + lngOffset];
}

function hashString(value) {
  return String(value).split('').reduce((total, char) => total + char.charCodeAt(0), 0);
}

function dealIcon(saleType) {
  const color = mapPinColors[saleType] || mapPinColors.default;
  const glyph = saleType === 'warehouse_sale' ? buildingSvg() : saleType === 'clearance' ? tagSvg() : bagSvg();
  return L.divIcon({
    className: '',
    iconSize: [42, 52],
    iconAnchor: [21, 52],
    popupAnchor: [0, -48],
    html: `
      <div style="position:relative;width:42px;height:52px;">
        <div style="position:absolute;left:3px;top:0;width:36px;height:36px;border-radius:50% 50% 50% 8px;background:${color};transform:rotate(-45deg);border:4px solid white;box-shadow:0 6px 16px rgba(0,0,0,.22);"></div>
        <div style="position:absolute;left:11px;top:9px;width:20px;height:20px;color:white;">${glyph}</div>
      </div>
    `
  });
}

function bagSvg() {
  return '<svg viewBox="0 0 24 24" fill="none"><path d="M7 8h10v12H7V8ZM9 8a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function buildingSvg() {
  return '<svg viewBox="0 0 24 24" fill="none"><path d="M5 21V5h9v16M14 9h5v12M8 9h3M8 13h3M8 17h3M17 13h1M17 17h1" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function tagSvg() {
  return '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12V5h7l9 9-6 6-10-8Z" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 8.5h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
}

function PinIcon({ kind }) {
  if (kind === 'building') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 21V5h9v16M14 9h5v12M8 9h3M8 13h3M8 17h3M17 13h1M17 17h1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'tag') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 12V5h7l9 9-6 6-10-8Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.5 8.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'home') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 11 12 4l8 7v9H6v-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 8h10v12H7V8ZM9 8a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h4M14 7h6M10 5v4M4 12h9M19 12h1M15 10v4M4 17h2M12 17h8M8 15v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function LocationArrowIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12 14-7-7 14-2-6-5-1Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2ZM10 20h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
