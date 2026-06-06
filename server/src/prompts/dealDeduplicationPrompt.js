export function buildDealDeduplicationPrompt(classifiedMention, existingDeals) {
  return `
Compare the classified raw mention with existing SaleRadar deals.
Decide if it is a duplicate.

Rules:
- Same store, same city, and same sale type is likely duplicate.
- Similar source/title and same location is likely duplicate.
- Different city should usually not be duplicate.
- Do not merge unrelated generic clearance events.
- Be conservative.

Return only valid JSON:
{
  "isDuplicate": boolean,
  "duplicateDealId": string | null,
  "confidenceScore": number,
  "reason": string
}

Classified mention:
${JSON.stringify(classifiedMention, null, 2)}

Existing deals:
${JSON.stringify(existingDeals, null, 2)}
`;
}
