export function buildDealSummaryPrompt(classification) {
  return `
Write one short cautious user-facing summary for this automatically detected deal.
Do not add facts not present in the JSON.
Mention that users should verify with the store before visiting.
Return plain text only.

Classification:
${JSON.stringify(classification, null, 2)}
`;
}
