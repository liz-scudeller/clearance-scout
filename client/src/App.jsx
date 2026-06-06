import { Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Admin from './pages/Admin';
import AdminScanner from './pages/AdminScanner';
import Alerts from './pages/Alerts';
import Dashboard from './pages/Dashboard';
import DealDetails from './pages/DealDetails';
import Deals from './pages/Deals';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Report from './pages/Report';
import Saved from './pages/Saved';
import { isSupabaseConfigured } from './services/supabaseClient';

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-bold text-ink">SaleRadar setup needed</h1>
        <p className="mt-3 text-stone-700">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env, then restart the frontend.
        </p>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/deals" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/deals/:id" element={<DealDetails />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/scanner" element={<AdminRoute><AdminScanner /></AdminRoute>} />
      </Routes>
    </>
  );
}
