import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) return setMessage(error.message);
    setMessage('Account created. Check your email if confirmation is enabled.');
    setTimeout(() => navigate('/deals'), 800);
  }

  return <main className="mx-auto max-w-md px-4 py-10"><h1 className="text-2xl font-bold text-ink">Create an account</h1><form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded border border-stone-200 bg-white p-4 shadow-sm">{message && <p className="rounded bg-stone-50 px-3 py-2 text-sm text-stone-700">{message}</p>}<label className="block text-sm font-medium text-ink">Full Name<input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label><label className="block text-sm font-medium text-ink">Email<input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label><label className="block text-sm font-medium text-ink">Password<input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength="6" required /></label><button className="w-full rounded bg-ink px-4 py-3 font-semibold text-white">Sign up</button><p className="text-sm text-stone-600">Already have an account? <Link className="font-semibold text-ink underline" to="/login">Log in</Link></p></form></main>;
}
