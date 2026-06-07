import { supabaseAdmin } from '../config/supabase.js';

const defaultAlertPreferences = {
  enabled: true,
  radius: 10,
  minimumConfidence: 60,
  categories: ['furniture', 'electronics', 'sports'],
  saleTypes: ['store_closing', 'clearance', 'warehouse_sale'],
  cities: ''
};

function profileFromRow(row = {}) {
  return {
    fullName: row.full_name || '',
    phone: row.phone || '',
    address: row.address || '',
    city: row.city || '',
    province: row.province || 'BC',
    postalCode: row.postal_code || '',
    latitude: row.latitude == null ? '' : String(row.latitude),
    longitude: row.longitude == null ? '' : String(row.longitude)
  };
}

function profileToRow(profile = {}) {
  return {
    full_name: profile.fullName || '',
    phone: profile.phone || '',
    address: profile.address || '',
    city: profile.city || '',
    province: profile.province || 'BC',
    postal_code: profile.postalCode || '',
    latitude: profile.latitude === '' || profile.latitude == null ? null : Number(profile.latitude),
    longitude: profile.longitude === '' || profile.longitude == null ? null : Number(profile.longitude),
    updated_at: new Date().toISOString()
  };
}

function alertsFromRow(row = {}) {
  return {
    ...defaultAlertPreferences,
    enabled: row.enabled ?? defaultAlertPreferences.enabled,
    radius: String(row.radius ?? defaultAlertPreferences.radius),
    minimumConfidence: String(row.minimum_confidence ?? defaultAlertPreferences.minimumConfidence),
    categories: row.categories || defaultAlertPreferences.categories,
    saleTypes: row.sale_types || defaultAlertPreferences.saleTypes,
    cities: row.cities || ''
  };
}

function alertsToRow(userId, preferences = {}) {
  return {
    user_id: userId,
    enabled: Boolean(preferences.enabled),
    radius: Number(preferences.radius || defaultAlertPreferences.radius),
    minimum_confidence: Number(preferences.minimumConfidence || defaultAlertPreferences.minimumConfidence),
    categories: preferences.categories?.length ? preferences.categories : defaultAlertPreferences.categories,
    sale_types: preferences.saleTypes?.length ? preferences.saleTypes : defaultAlertPreferences.saleTypes,
    cities: preferences.cities || '',
    updated_at: new Date().toISOString()
  };
}

export async function getMyProfile(user) {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (data) return profileFromRow(data);

  const row = { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || '' };
  const { data: inserted, error: insertError } = await supabaseAdmin.from('profiles').insert(row).select('*').single();
  if (insertError) throw insertError;
  return profileFromRow(inserted);
}

export async function updateMyProfile(user, profile) {
  const row = { id: user.id, email: user.email, ...profileToRow(profile) };
  const { data, error } = await supabaseAdmin.from('profiles').upsert(row, { onConflict: 'id' }).select('*').single();
  if (error) throw error;
  return profileFromRow(data);
}

export async function getMyAlertPreferences(userId) {
  const { data, error } = await supabaseAdmin.from('alert_preferences').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return alertsFromRow(data || {});
}

export async function updateMyAlertPreferences(userId, preferences) {
  const { data, error } = await supabaseAdmin
    .from('alert_preferences')
    .upsert(alertsToRow(userId, preferences), { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) throw error;
  return alertsFromRow(data);
}

export async function listMySavedDealIds(userId) {
  const { data, error } = await supabaseAdmin.from('saved_deals').select('deal_id,created_at').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((item) => item.deal_id);
}

export async function saveDealForUser(userId, dealId) {
  const { error } = await supabaseAdmin.from('saved_deals').upsert({ user_id: userId, deal_id: dealId }, { onConflict: 'user_id,deal_id' });
  if (error) throw error;
}

export async function unsaveDealForUser(userId, dealId) {
  const { error } = await supabaseAdmin.from('saved_deals').delete().eq('user_id', userId).eq('deal_id', dealId);
  if (error) throw error;
}

export async function listMyHiddenDealIds(userId) {
  const { data, error } = await supabaseAdmin.from('hidden_deals').select('deal_id,created_at').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((item) => item.deal_id);
}

export async function hideDealForUser(userId, dealId) {
  const { error } = await supabaseAdmin.from('hidden_deals').upsert({ user_id: userId, deal_id: dealId }, { onConflict: 'user_id,deal_id' });
  if (error) throw error;
}

export async function unhideDealForUser(userId, dealId) {
  const { error } = await supabaseAdmin.from('hidden_deals').delete().eq('user_id', userId).eq('deal_id', dealId);
  if (error) throw error;
}
