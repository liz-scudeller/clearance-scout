export function buildDealClassificationPrompt(rawMention, thresholds) {
  return `
You are a local deal verification assistant for SaleRadar.

Decide whether this raw public mention is a real local liquidation, store closing, warehouse sale, relocation sale, clearance sale, final sale, floor model sale, or "everything must go" opportunity.

Ignore normal weekly flyers, ordinary discounts, vague promotions, and generic sales unless there is clear evidence of a relevant closing/liquidation/warehouse/relocation/final/clearance opportunity.

Be conservative:
- Never invent discounts, addresses, dates, store names, or locations.
- For search results, the source must be from the last 30 days. If source_published_at is missing or older than 30 days, set shouldCreateDeal false and suggestedStatus ignored.
- Do not create a deal when the store/business name is unknown and there is no specific mall/location/address. A generic "store closing sale" without an identifiable store is not actionable.
- Do not create a deal from old articles about stores that closed years ago, even if the article mentions a closing sale.
- If the raw mention includes a real image URL for the deal/store/source, return it as imageUrl. Do not invent image URLs.
- If no real image URL exists, return a short imageDescription that describes the likely visual category for a generic deal image.
- If a field is unknown, return null.
- Keep userFacingSummary short, cautious, and include "Detected automatically" when it may become user-facing.
- Use confidenceScore 0-100.
- suggestedStatus should be pending for every relevant deal; admins approve deals before they become active.
- suggestedStatus must be ignored when confidenceScore < ${thresholds.pendingReviewThreshold}.
- shouldCreateDeal must be true only for active or pending.

Return only valid JSON with this exact shape:
{
  "isRelevant": boolean,
  "relevanceReason": string,
  "saleType": "store_closing" | "clearance" | "warehouse_sale" | "relocation_sale" | "final_sale" | "floor_model_sale" | "other",
  "category": "clothing" | "shoes" | "sports" | "furniture" | "home" | "electronics" | "toys" | "baby" | "beauty" | "grocery" | "tools" | "other",
  "storeName": string | null,
  "locationName": string | null,
  "city": string | null,
  "province": string | null,
  "address": string | null,
  "discountText": string | null,
  "startDate": string | null,
  "expiresAt": string | null,
  "imageUrl": string | null,
  "imageDescription": string | null,
  "confidenceScore": number,
  "shouldCreateDeal": boolean,
  "suggestedStatus": "active" | "pending" | "ignored",
  "userFacingSummary": string,
  "adminNotes": string,
  "possibleDuplicateHints": string[]
}

Raw mention:
${JSON.stringify(rawMention, null, 2)}
`;
}
