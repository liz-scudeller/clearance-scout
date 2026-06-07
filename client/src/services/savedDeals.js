const savedEventName = 'clearance-scout:saved-deals';

function keyFor(userId) {
  return `clearance-scout:saved-deals:${userId || 'guest'}`;
}

function readIds(userId) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(userId)) || '[]');
  } catch {
    return [];
  }
}

function writeIds(userId, ids) {
  localStorage.setItem(keyFor(userId), JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(savedEventName));
}

export function getSavedDealIds(userId) {
  return readIds(userId);
}

export function isDealSaved(userId, dealId) {
  return readIds(userId).includes(dealId);
}

export function toggleSavedDeal(userId, dealId) {
  const ids = readIds(userId);
  const nextIds = ids.includes(dealId) ? ids.filter((id) => id !== dealId) : [dealId, ...ids];
  writeIds(userId, nextIds);
  return nextIds.includes(dealId);
}

export function saveDeal(userId, dealId) {
  const ids = readIds(userId);
  if (ids.includes(dealId)) return true;
  writeIds(userId, [dealId, ...ids]);
  return true;
}

export function subscribeToSavedDeals(callback) {
  window.addEventListener(savedEventName, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(savedEventName, callback);
    window.removeEventListener('storage', callback);
  };
}

export function notifySavedDealsChanged() {
  window.dispatchEvent(new CustomEvent(savedEventName));
}
