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
    source_published_at: rawMention.source_published_at || null,
    image_url: pickDealImageUrl(rawMention, classification),
    status: 'pending',
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

function pickDealImageUrl(rawMention, classification) {
  if (classification.imageUrl) return classification.imageUrl;
  if (rawMention.image_url) return rawMention.image_url;

  const text = [
    classification.imageDescription,
    classification.category,
    classification.saleType,
    classification.storeName,
    rawMention.title,
    rawMention.snippet
  ].filter(Boolean).join(' ').toLowerCase();

  if (text.includes('furniture') || text.includes('home') || text.includes('floor model')) {
    return imageByKey.furniture;
  }
  if (text.includes('sport') || text.includes('shoe') || text.includes('clothing')) {
    return imageByKey.sports;
  }
  if (text.includes('electronics') || text.includes('tech')) {
    return imageByKey.electronics;
  }
  if (text.includes('baby') || text.includes('toy')) {
    return imageByKey.toys;
  }
  if (text.includes('warehouse')) {
    return imageByKey.warehouse;
  }
  if (text.includes('clearance')) {
    return imageByKey.clearance;
  }
  return imageByKey.storefront;
}

const imageByKey = {
  storefront: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80',
  clearance: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80',
  warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80',
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80',
  electronics: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80',
  toys: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=900&q=80'
};

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
