const alertEventName = 'clearance-scout:alert-preferences';

export const defaultAlertPreferences = {
  enabled: true,
  radius: '10',
  minimumConfidence: '60',
  categories: ['furniture', 'electronics', 'sports'],
  saleTypes: ['store_closing', 'clearance', 'warehouse_sale'],
  cities: ''
};

function keyFor(userId) {
  return `clearance-scout:alert-preferences:${userId || 'guest'}`;
}

export function getAlertPreferences(userId) {
  try {
    return { ...defaultAlertPreferences, ...JSON.parse(localStorage.getItem(keyFor(userId)) || '{}') };
  } catch {
    return defaultAlertPreferences;
  }
}

export function saveAlertPreferences(userId, preferences) {
  localStorage.setItem(keyFor(userId), JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(alertEventName));
}
