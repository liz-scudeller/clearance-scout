import { NavLink } from 'react-router-dom';

const adminLinks = [
  { label: 'Review Queue', to: '/admin', end: true },
  { label: 'Scanner Inbox', to: '/admin/scanner' }
];

export default function AdminNav() {
  return (
    <nav className="mt-5 flex gap-2 overflow-x-auto border-b border-stone-200 pb-3">
      {adminLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `shrink-0 rounded-xl px-4 py-2 text-sm font-black ${isActive ? 'bg-brand text-white' : 'bg-white text-brand ring-1 ring-stone-200'}`}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
