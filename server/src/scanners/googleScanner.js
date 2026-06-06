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
    if (env.searchProvider === 'google_custom_search') return scanGoogleCustomSearch();
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
        sourceType: getSourceType(query, item.link)
      }));
    }
  }

  return dedupeMentions(mentions);
}

async function scanGoogleCustomSearch() {
  if (!env.googleSearchApiKey || !env.googleSearchEngineId) return [];

  const mentions = [];
  for (const query of allQueries) {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', env.googleSearchApiKey);
    url.searchParams.set('cx', env.googleSearchEngineId);
    url.searchParams.set('q', query);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google Custom Search request failed: ${response.status}`);
    const payload = await response.json();

    for (const item of payload.items || []) {
      mentions.push(toMention({
        title: item.title,
        snippet: item.snippet,
        sourceUrl: item.link,
        query,
        sourceType: getSourceType(query, item.link)
      }));
    }
  }

  return dedupeMentions(mentions);
}

function toMention({ title, snippet, sourceUrl, query, sourceType }) {
  return {
    title: title || query,
    snippet: snippet || '',
    raw_text: `${title || ''}\n${snippet || ''}`,
    source_url: sourceUrl,
    source_type: sourceType,
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

function detectCity(text) {
  const cities = ['Burnaby', 'Vancouver', 'Coquitlam', 'New Westminster', 'Surrey', 'Richmond'];
  return cities.find((city) => text.toLowerCase().includes(city.toLowerCase())) || 'Metro Vancouver';
}
