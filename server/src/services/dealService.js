import crypto from 'crypto';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';

const allowedStatuses = ['pending', 'active', 'rejected', 'expired', 'possibly_expired'];

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

export async function listPendingDeals() {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select(`
      *,
      profiles:reported_by(full_name,email),
      raw_deal_mentions:raw_mention_id(title,snippet,raw_text,source_url,source_type,detected_keywords,classification_result,confidence_score)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const dealIds = data.map((deal) => deal.id);
  if (!dealIds.length) return data;

  const { data: confirmations, error: confirmationError } = await supabaseAdmin
    .from('deal_confirmations')
    .select('deal_id,confirmation_status,user_id')
    .in('deal_id', dealIds);
  if (confirmationError) throw confirmationError;

  return data.map((deal) => {
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

export async function updateDealStatus(dealId, status) {
  if (!allowedStatuses.includes(status)) {
    const error = new Error('Invalid status');
    error.statusCode = 400;
    throw error;
  }

  if (status === 'active') {
    const { data: existingDeal, error: existingDealError } = await supabaseAdmin
      .from('deals')
      .select('id,reported_by,detection_method,source_url,raw_mention_id')
      .eq('id', dealId)
      .single();
    if (existingDealError) throw existingDealError;

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
  return data;
}

export async function deleteDeal(dealId) {
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
  return data;
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
