import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useAdminStatus } from '../hooks/useAdminStatus';

export default function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useAdminStatus();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const desktopClass = ({ isActive }) =>
    `rounded px-3 py-2 text-sm font-semibold ${isActive ? 'bg-brand text-white' : 'text-brand hover:bg-white'}`;

  const isMap = location.pathname === '/deals' && new URLSearchParams(location.search).get('view') === 'map';
  const isHome = location.pathname === '/deals' && !isMap;
  const mobileClass = ({ isActive }) =>
    `flex flex-col items-center ${isMap ? 'gap-0 text-[0px]' : 'gap-1 text-[11px]'} font-semibold ${isActive ? 'text-brand' : 'text-stone-500'}`;
  const mobileStaticClass = (active) =>
    `flex flex-col items-center ${isMap ? 'gap-0 text-[0px]' : 'gap-1 text-[11px]'} font-semibold ${active ? 'text-brand' : 'text-stone-500'}`;

  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-stone-200 bg-[#F8F7F2]/95 backdrop-blur md:block">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/deals" className="flex items-center gap-2 text-xl font-black text-brand">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white">CS</span>
            <span>Clearance Scout</span>
          </Link>
          <div className="hidden flex-wrap items-center gap-2 md:flex">
            <NavLink className={desktopClass} to="/deals">Deals</NavLink>
            <NavLink className={desktopClass} to="/alerts">Alerts</NavLink>
            <NavLink className={desktopClass} to="/saved">Saved</NavLink>
            <NavLink className={desktopClass} to="/profile">Profile</NavLink>
            <NavLink className={desktopClass} to="/report">Report</NavLink>
            {isAdmin && <NavLink className={desktopClass} to="/admin/scanner">Scanner</NavLink>}
            {isAdmin && <NavLink className={desktopClass} to="/admin">Admin</NavLink>}
            {user ? (
              <button onClick={handleLogout} className="rounded bg-white px-3 py-2 text-sm font-semibold text-brand shadow-sm">Log out</button>
            ) : (
              <NavLink className={desktopClass} to="/login">Log in</NavLink>
            )}
          </div>
        </nav>
      </header>

      <nav className={`fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 rounded-t-2xl border-t border-[#E5E7EB] bg-white px-3 shadow-[0_-8px_30px_rgba(11,31,58,.08)] md:hidden ${isMap ? 'pb-3 pt-3' : 'pb-3 pt-2'}`}>
        <Link className={mobileStaticClass(isHome)} to="/deals"><NavIcon name="home" />Home</Link>
        <Link className={mobileStaticClass(isMap)} to="/deals?view=map"><NavIcon name="map" />Map</Link>
        <NavLink className={`relative flex flex-col items-center font-semibold text-brand ${isMap ? '-mt-4 gap-0 text-[0px]' : '-mt-6 gap-1 text-[11px]'}`} to="/report">
          <span className={`grid place-items-center rounded-full bg-deal-orange text-white shadow-lg ${isMap ? 'h-10 w-10 text-2xl' : 'h-12 w-12 text-3xl'}`}>+</span>
          <span>Report</span>
        </NavLink>
        <NavLink className={mobileClass} to="/alerts"><NavIcon name="bell" />Alerts</NavLink>
        <NavLink className={mobileClass} to="/saved"><NavIcon name="heart" />Saved</NavLink>
      </nav>
    </>
  );
}

function NavIcon({ name }) {
  const paths = {
    home: <path d="M4 11 12 4l8 7v9H6v-9" />,
    map: <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Zm5-2v14m6-12v14" />,
    bell: <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2ZM10 20h4" />,
    heart: <path d="M20 8.5c0 5-8 10.5-8 10.5S4 13.5 4 8.5A4.2 4.2 0 0 1 12 6a4.2 4.2 0 0 1 8 2.5Z" />
  };

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </g>
    </svg>
  );
}
