import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import DealCard from '../components/DealCard';
import { useAdminStatus } from '../hooks/useAdminStatus';
import { useAuth } from '../hooks/useAuth';
import { getDeals } from '../services/api';
import { getHiddenDealIds, subscribeToHiddenDeals } from '../services/hiddenDeals';
import { getUserProfile, subscribeToUserProfile } from '../services/userProfile';
import { labelize } from '../utils/options';

const quickChips = [
  { label: 'Near me', value: { nearMe: true } },
  { label: 'Closing', value: { saleType: 'store_closing' } },
  { label: 'Warehouse', value: { saleType: 'warehouse_sale' } },
  { label: 'Clearance', value: { saleType: 'clearance' } },
  { label: 'Sports', value: { category: 'sports' } },
  { label: 'Furniture', value: { category: 'furniture' } },
  { label: 'More', value: {} }
];

const mapPinColors = {
  warehouse_sale: '#0B1F3A',
  clearance: '#F59E0B',
  relocation_sale: '#7E22CE',
  default: '#F45113'
};

export default function Deals() {
  const { user } = useAuth();
  const { isAdmin } = useAdminStatus();
  const userId = user?.id || 'guest';
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({ status: 'active' });
  const [search, setSearch] = useState('');
  const [view, setView] = useState(searchParams.get('view') === 'map' ? 'map' : 'list');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(() => getUserProfile(userId));
  const [hiddenDealIds, setHiddenDealIds] = useState(() => getHiddenDealIds(userId));

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

  useEffect(() => {
    setProfile(getUserProfile(userId));
    return subscribeToUserProfile(() => setProfile(getUserProfile(userId)));
  }, [userId]);

  useEffect(() => {
    setHiddenDealIds(getHiddenDealIds(userId));
    return subscribeToHiddenDeals(() => setHiddenDealIds(getHiddenDealIds(userId)));
  }, [userId]);

  useEffect(() => {
    if (profile.city && !filters.city) {
      setFilters((current) => ({ ...current, city: profile.city }));
    }
  }, [profile.city]);

  const visibleDeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    const availableDeals = deals.filter((deal) => !hiddenDealIds.includes(deal.id));
    if (!query) return availableDeals;
    return availableDeals.filter((deal) => [deal.title, deal.store_name, deal.city, deal.category, deal.sale_type].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [deals, hiddenDealIds, search]);

  function applyChip(chip) {
    if (chip.value.nearMe) {
      setFilters({ status: 'active', city: profile.city || '' });
      return;
    }

    setFilters({ status: 'active', city: profile.city || '', ...chip.value });
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
    <main className="mx-auto max-w-md px-5 pb-24 pt-4 md:max-w-6xl md:px-4 md:pb-8 md:pt-8">
      <section className="md:hidden">
        <div className="relative">
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="absolute left-0 top-3 grid h-11 w-11 place-items-center rounded-full text-brand-950">
            <MenuIcon />
          </button>
          <Link to="/alerts" aria-label="Open alerts" className="absolute right-0 top-3 z-10 grid h-11 w-11 place-items-center rounded-full text-brand-950">
            <BellIcon />
          </Link>
          <div className="flex min-h-[76px] items-center justify-center gap-3 px-12">
            <BrandMark />
            <div className="leading-none">
              <h1 className="text-[25px] font-black tracking-normal text-brand">Clearance</h1>
              <p className="-mt-0.5 text-[25px] font-black text-deal-orange">Scout</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <Link to="/profile" className="inline-flex min-w-0 items-center gap-2 font-medium text-app-text">
              <PinSmallIcon />
              <span className="truncate">Deals near <span className="font-black text-app-ink">{profile.city || 'Burnaby'}</span></span>
              <span className="text-stone-400">·</span>
              <span className="shrink-0">within 10 km</span>
            </Link>
            <Link to="/profile" className="shrink-0 text-sm font-black text-[#2563EB]">Change</Link>
          </div>
        </div>
      </section>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} isAdmin={isAdmin} user={user} profile={profile} />

      <section className="mt-4 md:mt-0">
        <div className="hidden md:block">
          <p className="text-xs font-semibold uppercase text-deal-amber">Clearance Scout</p>
          <h1 className="mt-1 text-3xl font-black text-brand-700">Deals near {profile.city || 'Burnaby'}</h1>
        </div>
        <label className="relative block">
          <span className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-slate-500 after:absolute after:-bottom-1 after:-right-1 after:h-2 after:w-2 after:rotate-45 after:border-r-2 after:border-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search store, category, city..."
            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-12 pr-4 text-base font-medium text-app-text shadow-[0_5px_16px_rgba(11,31,58,.06)] outline-none placeholder:text-slate-500 focus:border-brand"
          />
        </label>
        <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-1">
          <div className="flex w-max gap-2">
            {quickChips.map((chip) => {
              const active = chip.value.nearMe ? Boolean(filters.city && profile.city && filters.city === profile.city) : Object.entries(chip.value).some(([key, value]) => filters[key] === value);
              return (
                <button
                  key={chip.label}
                  onClick={() => applyChip(chip)}
                  className={`h-10 shrink-0 rounded-full border px-4 text-sm font-bold shadow-sm ${active ? 'border-brand bg-brand text-white' : 'border-[#E5E7EB] bg-white text-app-ink'}`}
                >
                  {chip.value.nearMe && <span className="mr-1.5">↗</span>}
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-black leading-tight text-app-ink">Nearby deals</h2>
            <p className="mt-0.5 text-sm font-medium text-app-text">{visibleDeals.length} deals found</p>
          </div>
          <div className="grid grid-cols-2 rounded-xl border border-[#E5E7EB] bg-white p-1 text-sm font-black shadow-sm">
            <button onClick={() => changeView('list')} className={`h-10 rounded-lg px-4 ${view === 'list' ? 'bg-brand text-white' : 'text-app-text'}`}>List</button>
            <button onClick={() => changeView('map')} className={`h-10 rounded-lg px-4 ${view === 'map' ? 'bg-brand text-white' : 'text-app-text'}`}>Map</button>
          </div>
        </div>
        <div className="hidden">
          <Link to="/profile" className="mt-3 inline-flex max-w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-brand shadow-sm ring-1 ring-stone-200">
            <PinSmallIcon />
            <span className="truncate">{profileLabel(profile)}</span>
          </Link>
        </div>
      </section>

      {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-stone-600">Loading deals...</p>
      ) : (
        <section className="mt-2">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleDeals.map((deal) => <DealCard key={deal.id} deal={deal} onConfirmed={loadDeals} onHidden={() => setHiddenDealIds(getHiddenDealIds(userId))} />)}
          </div>
          {!visibleDeals.length && <p className="text-sm text-stone-600">No deals match these filters.</p>}
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#FED7AA] bg-[#FFF1E8] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-deal-orange"><FlameIcon /></span>
              <div>
                <p className="text-sm font-black text-app-ink">New deals are added daily</p>
                <p className="mt-0.5 text-xs font-medium text-app-text">Turn on alerts so you never miss a deal.</p>
              </div>
            </div>
            <Link to="/alerts" className="shrink-0 rounded-xl border border-deal-orange px-4 py-2 text-sm font-black text-deal-orange">Enable</Link>
          </div>
        </section>
      )}
    </main>
  );
}

function BrandMark() {
  return (
    <div className="relative h-12 w-12 shrink-0">
      <span className="absolute inset-1 rounded-full border-[7px] border-deal-orange" />
      <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-deal-orange" />
      <span className="absolute bottom-1 left-[24px] h-5 w-5 rotate-45 rounded-br-sm bg-deal-orange" />
      <span className="absolute bottom-0 right-0 grid h-6 w-6 rotate-[-28deg] place-items-center rounded bg-brand text-white shadow-sm">
        <TagTinyIcon />
      </span>
    </div>
  );
}

function TagTinyIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12V5h7l9 9-6 6-10-8Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 8.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.8 2.5c.4 2.8-.8 4.5-2.1 6.1-1.2 1.5-2.5 3-2.2 5.3.2 1.8 1.6 3.2 3.5 3.2 2.2 0 3.8-1.6 3.8-3.8 0-1.7-.8-3.2-2.1-4.6 3.9 1.6 6.1 4.2 6.1 7.4 0 3.8-3.1 6.4-7.8 6.4s-7.8-2.7-7.8-6.8c0-3.3 2-5.5 4-7.6 1.7-1.8 3.4-3.5 4.6-5.6Z" />
    </svg>
  );
}

function MobileMenu({ open, onClose, isAdmin, user, profile }) {
  if (!open) return null;

  const links = [
    { label: 'Home', to: '/deals', icon: 'home' },
    { label: 'Profile', to: '/profile', icon: 'user' },
    { label: 'Alerts', to: '/alerts', icon: 'bell' },
    { label: 'Saved', to: '/saved', icon: 'heart' },
    { label: 'Report Deal', to: '/report', icon: 'plus' }
  ];

  if (isAdmin) links.push({ label: 'Admin Review', to: '/admin', icon: 'shield' });

  return (
    <div className="fixed inset-0 z-50 bg-black/30 md:hidden">
      <button aria-label="Close menu" className="absolute inset-0 h-full w-full" onClick={onClose} />
      <aside className="relative h-full w-[82%] max-w-[340px] bg-[#F8F7F2] px-5 py-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-deal-amber">Menu</p>
            <h2 className="mt-1 text-2xl font-black text-brand-700">Clearance Scout</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{user?.email || 'Guest user'}</p>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full bg-white text-app-ink shadow-sm">
            <CloseIcon />
          </button>
        </div>

        <Link onClick={onClose} to="/profile" className="mt-5 block rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-black text-app-ink">Home address</p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">{profileLabel(profile)}</p>
        </Link>

        <nav className="mt-5 grid gap-2">
          {links.map((item) => (
            <Link key={item.to} onClick={onClose} to={item.to} className="flex h-14 items-center gap-3 rounded-xl bg-white px-4 py-3 text-base font-black text-app-ink shadow-sm ring-1 ring-stone-100">
              <MenuItemIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}

function profileLabel(profile) {
  const values = [profile.address, profile.city, profile.province].filter(Boolean);
  if (values.length) return values.join(', ');
  return 'Set your home address';
}

function PinSmallIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s6-4.5 6-11a6 6 0 0 0-12 0c0 6.5 6 11 6 11Z" stroke="currentColor" strokeWidth="2.2" />
      <path d="M12 12a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function MenuItemIcon({ name }) {
  const paths = {
    home: <path d="M4 11 12 4l8 7v9H6v-9" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0" />,
    bell: <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2ZM10 20h4" />,
    heart: <path d="M20 8.5c0 5-8 10.5-8 10.5S4 13.5 4 8.5A4.2 4.2 0 0 1 12 6a4.2 4.2 0 0 1 8 2.5Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    shield: <path d="M12 3 19 6v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3Z" />
  };

  return (
    <svg className="h-6 w-6 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </g>
    </svg>
  );
}

function MapScreen({ deals, loading, error, search, setSearch, setView }) {
  const mapRef = useRef(null);
  const mapNodeRef = useRef(null);
  const markerLayerRef = useRef(null);
  const [selectedDeal, setSelectedDeal] = useState(deals[0] || null);
  const [mapMoved, setMapMoved] = useState(false);

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
    map.on('movestart', () => setMapMoved(true));

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
      const marker = L.marker(coords, { icon: dealIcon(deal.sale_type, selectedDeal?.id === deal.id) });
      marker.on('click', () => setSelectedDeal(deal));
      marker.addTo(layer);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { paddingTopLeft: [40, 110], paddingBottomRight: [40, 260], maxZoom: 13 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    }
  }, [deals, selectedDeal]);

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
    <main className="relative min-h-screen overflow-hidden bg-[#E7E2D9] pb-20 md:mx-auto md:max-w-6xl md:px-4 md:py-8">
      <section className="relative h-[calc(100vh-82px)] min-h-[590px] overflow-hidden md:h-[760px] md:rounded-[24px] md:border md:border-stone-200 md:shadow-2xl">
        <div ref={mapNodeRef} className="absolute inset-0 z-0" />

        <div className="absolute left-4 right-4 top-10 z-20 flex items-center gap-3 md:left-12 md:right-12">
          <label className="relative block flex-1">
            <span className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-app-ink after:absolute after:-bottom-1 after:-right-1 after:h-2 after:w-2 after:rotate-45 after:border-r-2 after:border-app-ink" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this area"
              className="h-12 w-full rounded-2xl border border-white/70 bg-white/95 pl-11 pr-4 text-base font-medium text-app-text shadow-[0_10px_30px_rgba(11,31,58,.12)] outline-none placeholder:text-stone-500"
            />
          </label>
          <button aria-label="Filters" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-app-ink shadow-[0_10px_30px_rgba(11,31,58,.12)]">
            <SlidersIcon />
          </button>
        </div>

        <div className="absolute left-4 top-[92px] z-20 flex max-w-[calc(100%-32px)] gap-2 overflow-x-auto">
          <span className="shrink-0 rounded-full bg-white/95 px-3 py-2 text-xs font-black text-brand shadow-sm">Closing</span>
          <span className="shrink-0 rounded-full bg-white/95 px-3 py-2 text-xs font-black text-brand shadow-sm">Warehouse</span>
          <span className="shrink-0 rounded-full bg-white/95 px-3 py-2 text-xs font-black text-brand shadow-sm">Within 10 km</span>
        </div>

        {mapMoved && (
          <button onClick={() => setMapMoved(false)} className="absolute left-1/2 top-[138px] z-20 -translate-x-1/2 rounded-full bg-brand px-4 py-2 text-sm font-black text-white shadow-lg">
            Search this area
          </button>
        )}

        <button onClick={useMyLocation} aria-label="Use my location" className="absolute bottom-[178px] right-4 z-20 grid h-12 w-12 place-items-center rounded-full bg-white text-app-ink shadow-[0_10px_30px_rgba(11,31,58,.15)]">
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
    <article className="absolute bottom-4 left-4 right-4 z-30 rounded-[20px] bg-white p-3.5 shadow-[0_15px_38px_rgba(11,31,58,.18)] md:left-12 md:right-12">
      <div className="grid grid-cols-[1fr_92px] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase text-white ${saleBadgeClass(deal.sale_type)}`}>{labelize(deal.sale_type)}</span>
            <span className="text-xs font-black text-[#2563EB]">1.8 km</span>
          </div>
          <h2 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-app-ink">{cleanMapTitle(deal)}</h2>
          <p className="mt-1 line-clamp-1 text-sm font-medium text-app-text">{deal.store_name || 'Local source'}{deal.city ? ` · ${deal.city}` : ''}</p>
          <p className="mt-2 text-lg font-black text-deal-orange">{deal.discount_text || 'Deal details available'}</p>
          <p className="mt-1 text-xs font-semibold text-app-text">{deal.active_confirmation_count || 0} confirmed active · {formatUpdated(deal.updated_at || deal.created_at)}</p>
        </div>
        <div className="h-24 overflow-hidden rounded-xl bg-stone-100">
          {deal.image_url ? (
            <img src={deal.image_url} alt={deal.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-700 to-brand-950 text-sm font-black text-white">SALE</div>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={directionsUrl(deal)} target="_blank" rel="noreferrer" className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-black text-white shadow-sm">Directions</a>
        <Link to={`/deals/${deal.id}`} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-center text-sm font-black text-app-ink">Details</Link>
      </div>
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

function dealIcon(saleType, selected = false) {
  const color = mapPinColors[saleType] || mapPinColors.default;
  const glyph = saleType === 'warehouse_sale' ? buildingSvg() : saleType === 'clearance' ? tagSvg() : bagSvg();
  const size = selected ? 48 : 38;
  const pinSize = selected ? 40 : 32;
  const border = selected ? '#0B1F3A' : '#FFFFFF';
  const borderWidth = selected ? 5 : 3;
  const iconLeft = selected ? 13 : 10;
  const iconTop = selected ? 10 : 8;
  const iconSize = selected ? 22 : 18;
  return L.divIcon({
    className: '',
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -48],
    html: `
      <div style="position:relative;width:${size}px;height:${size + 10}px;">
        ${selected ? `<div style="position:absolute;left:0;top:0;width:${size}px;height:${size}px;border-radius:999px;background:rgba(255,90,31,.16);"></div>` : ''}
        <div style="position:absolute;left:${(size - pinSize) / 2}px;top:${selected ? 2 : 3}px;width:${pinSize}px;height:${pinSize}px;border-radius:50% 50% 50% 8px;background:${color};transform:rotate(-45deg);border:${borderWidth}px solid ${border};box-shadow:0 6px 14px rgba(11,31,58,.22);"></div>
        <div style="position:absolute;left:${iconLeft}px;top:${iconTop}px;width:${iconSize}px;height:${iconSize}px;color:white;">${glyph}</div>
      </div>
    `
  });
}

function saleBadgeClass(saleType) {
  if (saleType === 'warehouse_sale') return 'bg-brand';
  if (saleType === 'clearance') return 'bg-deal-amber';
  if (saleType === 'relocation_sale') return 'bg-[#7E22CE]';
  return 'bg-deal-orange';
}

function cleanMapTitle(deal) {
  return String(deal.title || '')
    .replace(/\bStore Closing Sale\b/gi, 'Closing Sale')
    .replace(/\bStore Closing\b/gi, 'Closing')
    .trim();
}

function formatUpdated(dateValue) {
  if (!dateValue) return 'Updated today';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Updated today';

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((startOfToday - startOfDate) / 86400000);

  if (days <= 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  if (days < 7) return `Updated ${days} days ago`;
  return `Updated ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function directionsUrl(deal) {
  const query = [deal.address, deal.city, deal.province, deal.store_name].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || deal.title || '')}`;
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
