import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';

export async function isAdminUser(user) {
  const email = user?.email?.toLowerCase();
  if (email && env.adminEmails.includes(email)) return true;

  const { data, error } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  return !error && data?.role === 'admin';
}

export async function requireAdmin(req, res, next) {
  if (await isAdminUser(req.user)) return next();

  return res.status(403).json({ error: 'Admin access required' });
}
