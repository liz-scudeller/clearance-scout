import { supabaseAdmin } from '../config/supabase.js';

const keywords = ['closing', 'clearance', 'relocation', 'renovation', 'warehouse', 'final sale', 'everything must go'];

export const mallScanner = {
  name: 'mall',
  async scan() {
    const { data: sources, error } = await supabaseAdmin
      .from('deal_sources')
      .select('*')
      .eq('is_active', true)
      .eq('source_type', 'mall');
    if (error) throw error;

    const mentions = [];
    for (const source of sources) {
      try {
        const response = await fetch(source.base_url);
        if (!response.ok) continue;
        const html = await response.text();
        const plainText = stripHtml(html);
        const lower = plainText.toLowerCase();
        const detected = keywords.filter((keyword) => lower.includes(keyword));

        if (detected.length) {
          mentions.push({
            source_id: source.id,
            title: `${source.name} sale mention`,
            snippet: extractSnippet(plainText, detected[0]),
            raw_text: plainText.slice(0, 5000),
            source_url: source.base_url,
            source_type: 'mall',
            city: source.city,
            province: source.province
          });
        }
      } catch {
        // Keep the MVP scanner resilient when one public site blocks or times out.
      }
    }

    return mentions;
  }
};

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSnippet(text, keyword) {
  const index = text.toLowerCase().indexOf(keyword);
  if (index === -1) return text.slice(0, 300);
  return text.slice(Math.max(0, index - 120), index + 220);
}
