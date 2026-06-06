import { supabaseAdmin } from '../config/supabase.js';
import { normalizeText } from '../utils/textUtils.js';

export async function findAiDuplicate(classification) {
  const city = classification.city;
  if (!city) {
    return { isDuplicate: false, duplicateDealId: null, confidenceScore: 0, reason: 'No city to compare.' };
  }

  const { data: deals, error } = await supabaseAdmin
    .from('deals')
    .select('id,title,store_name,city,sale_type,source_url')
    .ilike('city', city)
    .limit(50);
  if (error) throw error;

  return compareAgainstExistingDeals(classification, deals);
}

export function compareAgainstExistingDeals(classification, existingDeals) {
  const store = normalizeText(classification.storeName || classification.locationName || '');
  const saleType = classification.saleType;

  for (const deal of existingDeals) {
    const sameCity = normalizeText(deal.city) === normalizeText(classification.city || '');
    const sameSaleType = deal.sale_type === saleType;
    const sameStore = store && normalizeText(deal.store_name) === store;
    const similarTitle = classification.possibleDuplicateHints?.some((hint) =>
      normalizeText(deal.title).includes(normalizeText(hint)) || normalizeText(hint).includes(normalizeText(deal.title))
    );

    if (sameCity && sameSaleType && sameStore) {
      return {
        isDuplicate: true,
        duplicateDealId: deal.id,
        confidenceScore: 95,
        reason: 'Same store, city, and sale type.'
      };
    }

    if (sameCity && sameSaleType && similarTitle) {
      return {
        isDuplicate: true,
        duplicateDealId: deal.id,
        confidenceScore: 80,
        reason: 'Similar title or duplicate hint in the same city and sale type.'
      };
    }
  }

  return { isDuplicate: false, duplicateDealId: null, confidenceScore: 20, reason: 'No likely duplicate found.' };
}
