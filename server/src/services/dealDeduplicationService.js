import { supabaseAdmin } from '../config/supabase.js';

export function normalizeTitle(title = '') {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export async function findDuplicateRawMention(mention) {
  if (mention.source_url) {
    const { data, error } = await supabaseAdmin
      .from('raw_deal_mentions')
      .select('id')
      .eq('source_url', mention.source_url)
      .limit(1);
    if (error) throw error;
    if (data.length) return data[0];
  }

  const normalizedTitle = normalizeTitle(mention.title);
  const { data, error } = await supabaseAdmin
    .from('raw_deal_mentions')
    .select('id,title,city')
    .ilike('city', mention.city || '')
    .limit(50);
  if (error) throw error;

  return data.find((item) => normalizeTitle(item.title) === normalizedTitle) || null;
}

export async function findDuplicateDeal({ title, sourceUrl, city, storeName }) {
  if (sourceUrl) {
    const { data, error } = await supabaseAdmin
      .from('deals')
      .select('id')
      .eq('source_url', sourceUrl)
      .limit(1);
    if (error) throw error;
    if (data.length) return data[0];
  }

  const normalizedTitle = normalizeTitle(title);
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select('id,title,store_name,city')
    .ilike('city', city || '')
    .limit(100);
  if (error) throw error;

  return data.find((deal) => {
    const sameTitle = normalizeTitle(deal.title) === normalizedTitle;
    const sameStore = storeName && deal.store_name && normalizeTitle(deal.store_name) === normalizeTitle(storeName);
    return sameTitle || sameStore;
  }) || null;
}
