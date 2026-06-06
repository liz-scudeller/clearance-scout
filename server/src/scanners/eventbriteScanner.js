import { env } from '../config/env.js';

const keywords = ['warehouse sale', 'sample sale', 'clearance', 'liquidation', 'moving sale', 'closing sale', 'outlet sale'];
const cities = ['Burnaby', 'Vancouver', 'Coquitlam', 'New Westminster', 'Surrey', 'Richmond'];

export const eventbriteScanner = {
  name: 'eventbrite',
  async scan() {
    if (!env.eventbriteApiKey) return [];

    const mentions = [];

    const organizations = await getOrganizations();
    for (const organization of organizations) {
      const events = await getOrganizationEvents(organization.id);
      for (const event of events) {
        const text = [
          event.name?.text,
          event.summary,
          event.description?.text,
          event.venue?.name,
          event.venue?.address?.localized_address_display
        ].filter(Boolean).join(' ');

        if (!hasDealKeyword(text)) continue;

        mentions.push({
          title: event.name?.text || 'Eventbrite sale event',
          snippet: event.summary || event.description?.text?.slice(0, 500) || '',
          raw_text: text,
          source_url: event.url,
          source_type: 'eventbrite',
          city: detectCity(text, event.venue?.address?.city),
          province: event.venue?.address?.region || 'BC'
        });
      }
    }

    return mentions;
  }
};

async function getOrganizations() {
  const response = await fetch('https://www.eventbriteapi.com/v3/users/me/organizations/', {
    headers: { Authorization: `Bearer ${env.eventbriteApiKey}` }
  });
  if (!response.ok) throw new Error(`Eventbrite organizations request failed: ${response.status}`);
  const payload = await response.json();
  return payload.organizations || [];
}

async function getOrganizationEvents(organizationId) {
  const url = new URL(`https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/`);
  url.searchParams.set('expand', 'venue');
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${env.eventbriteApiKey}` }
  });
  if (!response.ok) throw new Error(`Eventbrite organization events request failed: ${response.status}`);
  const payload = await response.json();
  return payload.events || [];
}

function hasDealKeyword(text) {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

function detectCity(text, venueCity) {
  if (venueCity) return venueCity;
  const lower = text.toLowerCase();
  return cities.find((city) => lower.includes(city.toLowerCase())) || 'Metro Vancouver';
}
