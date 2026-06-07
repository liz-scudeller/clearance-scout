import crypto from 'crypto';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';

const allowedStatuses = ['pending', 'active', 'rejected', 'expired', 'possibly_expired'];
const editableDealFields = {
  title: 'title',
  storeName: 'store_name',
  address: 'address',
  city: 'city',
  province: 'province',
  postalCode: 'postal_code',
  category: 'category',
  saleType: 'sale_type',
  discountText: 'discount_text',
  description: 'description',
  sourceType: 'source_type',
  sourceUrl: 'source_url',
  imageUrl: 'image_url',
  startDate: 'start_date',
  expiresAt: 'expires_at'
};

export async function listDeals(filters = {}) {
  let query = supabaseAdmin.from('deals_with_confirmation_counts').select('*').order('created_at', { ascending: false });
  if (filters.status) query = query.eq('status', filters.status);
  if (!filters.status) query = query.in('status', ['active', 'possibly_expired']);
  if (filters.city) query = query.ilike('city', `%${filters.city}%`);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.saleType) query = query.eq('sale_type', filters.saleType);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDealById(id) {
  const { data, error } = await supabaseAdmin.from('deals_with_confirmation_counts').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createDeal({ body, file, user }) {
  const imageUrl = file ? await uploadDealImage(file) : null;
  const deal = {
    title: body.title,
    store_name: body.storeName,
    address: body.address,
    city: body.city,
    province: body.province,
    postal_code: body.postalCode || null,
    category: body.category,
    sale_type: body.saleType,
    discount_text: body.discountText,
    description: body.description,
    source_type: body.sourceType,
    source_url: body.sourceUrl || null,
    image_url: imageUrl,
    status: 'pending',
    reported_by: user.id,
    start_date: body.startDate || null,
    expires_at: body.expiresAt || null
  };
  const { data, error } = await supabaseAdmin.from('deals').insert(deal).select('*').single();
  if (error) throw error;
  return data;
}

export async function addConfirmation(dealId, userId, confirmationStatus) {
  if (!['active', 'expired'].includes(confirmationStatus)) {
    const error = new Error('confirmationStatus must be active or expired');
    error.statusCode = 400;
    throw error;
  }
  const { error } = await supabaseAdmin.from('deal_confirmations').insert({ deal_id: dealId, user_id: userId, confirmation_status: confirmationStatus });
  if (error) throw error;
  await updateConfidenceScore(dealId);
  return getDealById(dealId);
}

export async function listPendingDeals(filters = {}) {
  const selectWithSourceDate = `
      *,
      profiles:reported_by(full_name,email),
      raw_deal_mentions:raw_mention_id(title,snippet,raw_text,source_url,source_type,source_published_at,detected_keywords,classification_result,confidence_score,deal_sources(name))
    `;
  const selectWithoutSourceDate = `
      *,
      profiles:reported_by(full_name,email),
      raw_deal_mentions:raw_mention_id(title,snippet,raw_text,source_url,source_type,detected_keywords,classification_result,confidence_score,deal_sources(name))
    `;

  const runQuery = (selectClause) => {
    let query = supabaseAdmin
      .from('deals')
      .select(selectClause)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

    if (filters.origin === 'user') query = query.not('reported_by', 'is', null);
    if (filters.origin === 'internal') query = query.eq('detection_method', 'scanner');
    if (filters.origin === 'ai') query = query.eq('detection_method', 'automated_ai');
    if (filters.city) query = query.ilike('city', `%${filters.city}%`);

    return query;
  };

  let { data, error } = await runQuery(selectWithSourceDate);
  if (String(error?.message || '').includes('source_published_at')) {
    ({ data, error } = await runQuery(selectWithoutSourceDate));
  }
  if (error) throw error;

  const search = String(filters.search || '').trim().toLowerCase();
  let filteredData = search
    ? data.filter((deal) => [deal.title, deal.store_name, deal.city, deal.discount_text, deal.profiles?.email, deal.raw_deal_mentions?.snippet].filter(Boolean).join(' ').toLowerCase().includes(search))
    : data;
  if (filters.missingSource === 'true') {
    filteredData = filteredData.filter((deal) => {
      const isAutomated = !deal.reported_by && ['automated_ai', 'scanner'].includes(deal.detection_method);
      return isAutomated && !(deal.source_url || deal.raw_deal_mentions?.source_url);
    });
  }

  const dealIds = filteredData.map((deal) => deal.id);
  if (!dealIds.length) return filteredData;

  const { data: confirmations, error: confirmationError } = await supabaseAdmin
    .from('deal_confirmations')
    .select('deal_id,confirmation_status,user_id')
    .in('deal_id', dealIds);
  if (confirmationError) throw confirmationError;

  return filteredData.map((deal) => {
    const dealConfirmations = confirmations.filter((item) => item.deal_id === deal.id);
    const uniqueUsers = new Set(dealConfirmations.map((item) => item.user_id));
    return {
      ...deal,
      confirmation_count: dealConfirmations.length,
      active_confirmation_count: dealConfirmations.filter((item) => item.confirmation_status === 'active').length,
      expired_confirmation_count: dealConfirmations.filter((item) => item.confirmation_status === 'expired').length,
      unique_confirmation_users: uniqueUsers.size
    };
  });
}

export async function updateDealStatus(dealId, status, adminUserId = null) {
  if (!allowedStatuses.includes(status)) {
    const error = new Error('Invalid status');
    error.statusCode = 400;
    throw error;
  }

  if (status === 'active') {
    const { data: existingDeal, error: existingDealError } = await supabaseAdmin
      .from('deals')
      .select('id,reported_by,detection_method,source_url,raw_mention_id,expires_at')
      .eq('id', dealId)
      .single();
    if (existingDealError) throw existingDealError;

    if (isPastDate(existingDeal.expires_at)) {
      const error = new Error('This deal is already expired and cannot be approved.');
      error.statusCode = 400;
      throw error;
    }

    const isAutomated = !existingDeal.reported_by && ['automated_ai', 'scanner'].includes(existingDeal.detection_method);
    if (isAutomated && !existingDeal.source_url) {
      const { data: rawMention, error: rawMentionError } = await supabaseAdmin
        .from('raw_deal_mentions')
        .select('source_url')
        .eq('id', existingDeal.raw_mention_id)
        .maybeSingle();
      if (rawMentionError) throw rawMentionError;

      if (!rawMention?.source_url) {
        const error = new Error('Automated deals require a source link before approval.');
        error.statusCode = 400;
        throw error;
      }
    }
  }

  const { data, error } = await supabaseAdmin.from('deals').update({ status, updated_at: new Date().toISOString() }).eq('id', dealId).select('*').single();
  if (error) throw error;
  await logAdminAction(adminUserId, 'deal', dealId, `status:${status}`, { status });
  return data;
}

function isPastDate(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

export async function updateDealDetails(dealId, body = {}, adminUserId = null) {
  const update = {};
  Object.entries(editableDealFields).forEach(([bodyKey, dbKey]) => {
    if (Object.prototype.hasOwnProperty.call(body, bodyKey)) {
      update[dbKey] = body[bodyKey] === '' ? null : body[bodyKey];
    }
  });

  if (!Object.keys(update).length) {
    const error = new Error('No editable fields provided.');
    error.statusCode = 400;
    throw error;
  }

  update.updated_at = new Date().toISOString();
  const { data, error } = await supabaseAdmin.from('deals').update(update).eq('id', dealId).select('*').single();
  if (error) throw error;
  await logAdminAction(adminUserId, 'deal', dealId, 'edit', { fields: Object.keys(update).filter((key) => key !== 'updated_at') });
  return data;
}

export async function deleteDeal(dealId, adminUserId = null) {
  const { error: confirmationError } = await supabaseAdmin
    .from('deal_confirmations')
    .delete()
    .eq('deal_id', dealId);
  if (confirmationError) throw confirmationError;

  const { data, error } = await supabaseAdmin
    .from('deals')
    .delete()
    .eq('id', dealId)
    .select('id,title')
    .single();
  if (error) throw error;
  await logAdminAction(adminUserId, 'deal', dealId, 'delete', { title: data.title });
  return data;
}

async function logAdminAction(adminUserId, entityType, entityId, action, details = {}) {
  const { error } = await supabaseAdmin.from('admin_audit_log').insert({
    admin_user_id: adminUserId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    details
  });
  if (error && !String(error.message || '').includes('admin_audit_log')) throw error;
}

async function uploadDealImage(file) {
  const extension = file.originalname.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabaseAdmin.storage.from(env.storageBucket).upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) {
    const uploadError = new Error(`Photo upload failed: ${error.message}. Check Supabase Storage bucket "${env.storageBucket}".`);
    uploadError.statusCode = 400;
    throw uploadError;
  }
  const { data } = supabaseAdmin.storage.from(env.storageBucket).getPublicUrl(fileName);
  return data.publicUrl;
}

async function updateConfidenceScore(dealId) {
  const { data: confirmations, error } = await supabaseAdmin.from('deal_confirmations').select('confirmation_status').eq('deal_id', dealId);
  if (error) throw error;
  const activeCount = confirmations.filter((item) => item.confirmation_status === 'active').length;
  const expiredCount = confirmations.filter((item) => item.confirmation_status === 'expired').length;
  const confidenceScore = Math.max(0, Math.min(100, 50 + activeCount * 10 - expiredCount * 15));
  const update = { confidence_score: confidenceScore, updated_at: new Date().toISOString() };
  if (expiredCount >= 3 && expiredCount > activeCount) update.status = 'possibly_expired';
  const { error: updateError } = await supabaseAdmin.from('deals').update(update).eq('id', dealId);
  if (updateError) throw updateError;
}
