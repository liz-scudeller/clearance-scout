import { labelize } from '../utils/textUtils.js';

export function buildDealFromAiClassification(rawMention, classification, duplicateContext = {}) {
  const saleTypeLabel = labelize(classification.saleType || 'other');
  const city = classification.city || rawMention.city || 'Metro Vancouver';
  const storeName = classification.storeName || classification.locationName || detectStoreName(rawMention.title);

  return {
    title: buildTitle({ rawTitle: rawMention.title, storeName, saleTypeLabel, city }),
    store_name: storeName,
    address: classification.address || 'Address to verify',
    city,
    province: classification.province || rawMention.province || 'BC',
    postal_code: null,
    category: classification.category || 'other',
    sale_type: classification.saleType || 'other',
    discount_text: classification.discountText || 'Deal details to verify',
    description: classification.userFacingSummary || rawMention.snippet || rawMention.raw_text || rawMention.title,
    source_type: rawMention.source_type || 'automated_scan',
    source_url: rawMention.source_url,
    status: classification.suggestedStatus === 'active' ? 'active' : 'pending',
    confidence_score: 50,
    source_confidence: classification.confidenceScore || rawMention.confidence_score || 50,
    raw_mention_id: rawMention.id,
    source_id: rawMention.source_id,
    detection_method: 'automated_ai',
    ai_summary: classification.userFacingSummary,
    ai_confidence_score: classification.confidenceScore,
    start_date: classification.startDate,
    expires_at: classification.expiresAt,
    ...duplicateContext
  };
}

function buildTitle({ rawTitle, storeName, saleTypeLabel, city }) {
  if (rawTitle && rawTitle.length <= 90 && !rawTitle.toLowerCase().includes('sale mention')) {
    return rawTitle;
  }

  if (storeName && city) return `${storeName} ${saleTypeLabel} in ${city}`;
  if (city) return `${saleTypeLabel} in ${city}`;
  return `${saleTypeLabel} Deal`;
}

function detectStoreName(title = '') {
  return title.split(/[-|:]/)[0].trim().slice(0, 120) || 'Store to verify';
}
