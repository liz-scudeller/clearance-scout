import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useAdminStatus } from '../hooks/useAdminStatus';

export default function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useAdminStatus();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const isMap = location.pathname === '/deals' && searchParams.get('view') === 'map';
  const isHome = location.pathname === '/deals' && !isMap;

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const desktopClass = ({ isActive }) =>
    [
      'rounded-xl px-3 py-2 text-sm font-semibold transition',
      isActive
        ? 'bg-brand text-white shadow-sm'
        : 'text-brand hover:bg-brand/5'
    ].join(' ');

  const mobileItemClass = (active) =>
    [
      'flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition',
      active ? 'text-brand' : 'text-slate-500'
    ].join(' ');

  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-stone-200 bg-app-paper/95 backdrop-blur md:block">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/deals" className="flex items-center gap-2 text-xl font-black text-brand">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-deal-orange text-white shadow-sm">
              CS
            </span>
            <span>Clearance Scout</span>
          </Link>

          <div className="hidden flex-wrap items-center gap-2 md:flex">
            <NavLink className={desktopClass} to="/deals">Deals</NavLink>
            <NavLink className={desktopClass} to="/alerts">Alerts</NavLink>
            <NavLink className={desktopClass} to="/saved">Saved</NavLink>
            <NavLink className={desktopClass} to="/profile">Profile</NavLink>
            <NavLink className={desktopClass} to="/report">Report</NavLink>

            {isAdmin && (
              <NavLink className={desktopClass} to="/admin">Admin</NavLink>
            )}

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-brand shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-50"
              >
                Log out
              </button>
            ) : (
              <NavLink className={desktopClass} to="/login">Log in</NavLink>
            )}
          </div>
        </nav>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 rounded-t-[28px] border-t border-stone-200 bg-white/95 px-3 pb-3 pt-2 shadow-[0_-10px_35px_rgba(11,31,58,.10)] backdrop-blur md:hidden">
        <Link className={mobileItemClass(isHome)} to="/deals" aria-label="Home">
          <NavIcon name="home" />
          <span>Home</span>
        </Link>

        <Link className={mobileItemClass(isMap)} to="/deals?view=map" aria-label="Map">
          <NavIcon name="map" />
          <span>Map</span>
        </Link>

        <NavLink
          to="/report"
          aria-label="Report a sale"
          className={({ isActive }) =>
            [
              'relative -mt-5 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition',
              isActive ? 'text-deal-orange' : 'text-brand'
            ].join(' ')
          }
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-deal-orange text-white shadow-[0_10px_25px_rgba(255,90,31,.35)] ring-4 ring-white">
            <PlusIcon />
          </span>
          <span>Report</span>
        </NavLink>

        <NavLink
          className={({ isActive }) => mobileItemClass(isActive)}
          to="/alerts"
          aria-label="Alerts"
        >
          <NavIcon name="bell" />
          <span>Alerts</span>
        </NavLink>

        <NavLink
          className={({ isActive }) => mobileItemClass(isActive)}
          to="/saved"
          aria-label="Saved"
        >
          <NavIcon name="heart" />
          <span>Saved</span>
        </NavLink>
      </nav>
    </>
  );
}

function NavIcon({ name }) {
  const paths = {
    home: (
      <>
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6.5 10v9.5h11V10" />
        <path d="M10 19.5v-5h4v5" />
      </>
    ),

    map: (
      <>
        <path d="M4 6.5 9 4.5l6 2 5-2v13l-5 2-6-2-5 2v-13Z" />
        <path d="M9 4.5v13" />
        <path d="M15 6.5v13" />
      </>
    ),

    bell: (
      <>
        <path d="M18 15.5V11a6 6 0 0 0-12 0v4.5l-1.75 2h15.5L18 15.5Z" />
        <path d="M10 20h4" />
      </>
    ),

    heart: (
      <path d="M20 8.75c0 4.75-8 9.75-8 9.75s-8-5-8-9.75A4.25 4.25 0 0 1 12 6.25a4.25 4.25 0 0 1 8 2.5Z" />
    )
  };

  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </g>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}