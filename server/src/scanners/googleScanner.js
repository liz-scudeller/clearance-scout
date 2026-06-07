import { env } from '../config/env.js';

const queries = [
  '"store closing sale" Burnaby',
  '"closing sale" "Lougheed"',
  '"warehouse sale" Vancouver',
  '"liquidation sale" Coquitlam',
  '"everything must go" Burnaby',
  '"relocation sale" "Metro Vancouver"',
  '"floor model sale" Vancouver',
  '"clearance sale" Burnaby'
];

const eventbriteQueries = [
  'site:eventbrite.ca "warehouse sale" Vancouver',
  'site:eventbrite.ca "sample sale" Vancouver',
  'site:eventbrite.ca clearance Burnaby',
  'site:eventbrite.ca liquidation Coquitlam',
  'site:eventbrite.ca "moving sale" "Metro Vancouver"',
  'site:eventbrite.ca "closing sale" Burnaby',
  'site:eventbrite.ca "outlet sale" Richmond',
  'site:eventbrite.com "warehouse sale" Vancouver',
  'site:eventbrite.com "sample sale" Vancouver',
  'site:eventbrite.com "everything must go" "Metro Vancouver"'
];

const allQueries = [...queries, ...eventbriteQueries];

export const googleScanner = {
  name: 'google',
  async scan() {
    if (env.searchProvider === 'google_custom_search') {
      try {
        return await scanGoogleCustomSearch();
      } catch (error) {
        if (!env.serpApiKey) throw error;
        console.warn(`Google Custom Search failed; falling back to SerpAPI: ${error.message}`);
        return scanSerpApi();
      }
    }

    return scanSerpApi();
  }
};

async function scanSerpApi() {
  if (!env.serpApiKey) return [];

  const mentions = [];
  for (const query of allQueries) {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', query);
    url.searchParams.set('location', 'Vancouver, British Columbia, Canada');
    url.searchParams.set('tbs', 'qdr:m');
    url.searchParams.set('api_key', env.serpApiKey);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`SerpAPI request failed: ${response.status}`);
    const payload = await response.json();

    for (const item of payload.organic_results || []) {
      mentions.push(toMention({
        title: item.title,
        snippet: item.snippet,
        sourceUrl: item.link,
        query,
        sourceType: getSourceType(query, item.link),
        sourcePublishedAt: parseSourceDate(item.date || item.rich_snippet?.top?.detected_extensions?.date || item.snippet)
      }));
    }
  }

  return dedupeMentions(mentions).filter(isRecentMention);
}

async function scanGoogleCustomSearch() {
  if (!env.googleSearchApiKey || !env.googleSearchEngineId) return [];

  const mentions = [];
  for (const query of allQueries) {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', env.googleSearchApiKey);
    url.searchParams.set('cx', env.googleSearchEngineId);
    url.searchParams.set('q', query);
    url.searchParams.set('dateRestrict', 'm1');

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google Custom Search request failed: ${response.status}`);
    const payload = await response.json();

    for (const item of payload.items || []) {
      mentions.push(toMention({
        title: item.title,
        snippet: item.snippet,
        sourceUrl: item.link,
        query,
        sourceType: getSourceType(query, item.link),
        sourcePublishedAt: extractGoogleItemDate(item)
      }));
    }
  }

  return dedupeMentions(mentions).filter(isRecentMention);
}

function toMention({ title, snippet, sourceUrl, query, sourceType, sourcePublishedAt }) {
  return {
    title: title || query,
    snippet: snippet || '',
    raw_text: `${title || ''}\n${snippet || ''}`,
    source_url: sourceUrl,
    source_type: sourceType,
    source_published_at: sourcePublishedAt,
    city: detectCity(`${query} ${title} ${snippet}`),
    province: 'BC'
  };
}

function getSourceType(query, sourceUrl = '') {
  const text = `${query} ${sourceUrl}`.toLowerCase();
  return text.includes('eventbrite.') ? 'eventbrite_public_search' : 'search';
}

function dedupeMentions(mentions) {
  const seen = new Set();
  return mentions.filter((mention) => {
    const key = mention.source_url || `${mention.title}-${mention.city}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isRecentMention(mention) {
  if (!mention.source_published_at) return false;
  const sourceDate = new Date(mention.source_published_at);
  if (Number.isNaN(sourceDate.getTime())) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  return sourceDate >= cutoff;
}

function extractGoogleItemDate(item) {
  const metatags = item.pagemap?.metatags?.[0] || {};
  return parseSourceDate(
    metatags['article:published_time'] ||
    metatags['article:modified_time'] ||
    metatags['og:updated_time'] ||
    item.snippet
  );
}

function parseSourceDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  const lower = text.toLowerCase();
  const now = new Date();
  const relative = lower.match(/(\d+)\s+(hour|day|week|month)s?\s+ago/);

  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2];
    const date = new Date(now);
    if (unit === 'hour') date.setHours(date.getHours() - amount);
    if (unit === 'day') date.setDate(date.getDate() - amount);
    if (unit === 'week') date.setDate(date.getDate() - amount * 7);
    if (unit === 'month') date.setMonth(date.getMonth() - amount);
    return date.toISOString();
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

  const datePrefix = text.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}/i);
  if (datePrefix) {
    const date = new Date(datePrefix[0]);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  return null;
}

function detectCity(text) {
  const cities = ['Burnaby', 'Vancouver', 'Coquitlam', 'New Westminster', 'Surrey', 'Richmond'];
  return cities.find((city) => text.toLowerCase().includes(city.toLowerCase())) || 'Metro Vancouver';
}
