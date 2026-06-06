import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';

export async function requireAdmin(req, res, next) {
  const email = req.user?.email?.toLowerCase();
  if (email && env.adminEmails.includes(email)) return next();

  const { data, error } = await supabaseAdmin.from('profiles').select('role').eq('id', req.user.id).single();
  if (!error && data?.role === 'admin') return next();

  return res.status(403).json({ error: 'Admin access required' });
}
