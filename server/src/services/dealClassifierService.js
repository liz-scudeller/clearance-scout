const saleTypeRules = [
  { saleType: 'store_closing', keywords: ['store closing', 'closing sale', 'going out of business'] },
  { saleType: 'warehouse_sale', keywords: ['warehouse sale', 'liquidation sale'] },
  { saleType: 'relocation_sale', keywords: ['relocation sale', 'moving sale'] },
  { saleType: 'floor_model_sale', keywords: ['floor model', 'floor models'] },
  { saleType: 'final_sale', keywords: ['final sale', 'everything must go'] },
  { saleType: 'clearance', keywords: ['clearance'] }
];

const categoryRules = [
  { category: 'sports', keywords: ['sport', 'fitness', 'hockey', 'bike', 'outdoor'] },
  { category: 'furniture', keywords: ['furniture', 'sofa', 'mattress', 'table', 'chair'] },
  { category: 'electronics', keywords: ['electronics', 'computer', 'phone', 'tv', 'audio'] },
  { category: 'baby', keywords: ['baby', 'kids', 'children', 'nursery'] },
  { category: 'beauty', keywords: ['beauty', 'cosmetic', 'salon', 'skincare'] },
  { category: 'grocery', keywords: ['grocery', 'market', 'food'] },
  { category: 'tools', keywords: ['tools', 'hardware'] },
  { category: 'shoes', keywords: ['shoes', 'footwear'] },
  { category: 'clothing', keywords: ['clothing', 'apparel', 'fashion'] },
  { category: 'home', keywords: ['home', 'decor', 'housewares'] },
  { category: 'toys', keywords: ['toy', 'toys'] }
];

const highConfidenceKeywords = ['closing sale', 'store closing', 'everything must go', 'warehouse sale', 'liquidation'];
const mediumConfidenceKeywords = ['clearance', 'final sale', 'relocation sale', 'moving sale', 'floor model'];
const lowConfidenceKeywords = ['sale', 'discount', 'deals'];

export function classifyMention(mention) {
  const text = [mention.title, mention.snippet, mention.raw_text].filter(Boolean).join(' ').toLowerCase();
  const detectedKeywords = collectKeywords(text);
  const saleType = findRuleMatch(text, saleTypeRules, 'saleType') || 'other';
  const category = findRuleMatch(text, categoryRules, 'category') || 'other';
  const confidenceScore = scoreConfidence(text);

  return {
    saleType,
    category,
    confidenceScore,
    detectedKeywords,
    shouldCreateDeal: confidenceScore >= 60,
    dealStatus: confidenceScore >= 80 ? 'active' : 'pending'
  };
}

function findRuleMatch(text, rules, key) {
  const rule = rules.find((item) => item.keywords.some((keyword) => text.includes(keyword)));
  return rule?.[key] || null;
}

function scoreConfidence(text) {
  if (highConfidenceKeywords.some((keyword) => text.includes(keyword))) return 85;
  if (mediumConfidenceKeywords.some((keyword) => text.includes(keyword))) return 65;
  if (lowConfidenceKeywords.some((keyword) => text.includes(keyword))) return 35;
  return 10;
}

function collectKeywords(text) {
  return [...highConfidenceKeywords, ...mediumConfidenceKeywords, ...lowConfidenceKeywords]
    .filter((keyword) => text.includes(keyword));
}
