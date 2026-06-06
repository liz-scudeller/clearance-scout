import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return setError(signInError.message);
    navigate('/deals');
  }

  return <main className="mx-auto max-w-md px-4 py-10"><h1 className="text-2xl font-bold text-ink">Log in</h1><p className="mt-2 text-stone-600">Find local closing sales near you.</p><form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded border border-stone-200 bg-white p-4 shadow-sm">{error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<label className="block text-sm font-medium text-ink">Email<input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label><label className="block text-sm font-medium text-ink">Password<input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label><button className="w-full rounded bg-ink px-4 py-3 font-semibold text-white">Log in</button><p className="text-sm text-stone-600">New here? <Link className="font-semibold text-ink underline" to="/register">Create an account</Link></p></form></main>;
}
