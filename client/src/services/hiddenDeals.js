const hiddenEventName = 'clearance-scout:hidden-deals';

function keyFor(userId) {
  return `clearance-scout:hidden-deals:${userId || 'guest'}`;
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
  window.dispatchEvent(new CustomEvent(hiddenEventName));
}

export function getHiddenDealIds(userId) {
  return readIds(userId);
}

export function isDealHidden(userId, dealId) {
  return readIds(userId).includes(dealId);
}

export function hideDeal(userId, dealId) {
  const ids = readIds(userId);
  if (ids.includes(dealId)) return ids;
  const nextIds = [dealId, ...ids];
  writeIds(userId, nextIds);
  return nextIds;
}

export function unhideDeal(userId, dealId) {
  const ids = readIds(userId);
  const nextIds = ids.filter((id) => id !== dealId);
  writeIds(userId, nextIds);
  return nextIds;
}

export function subscribeToHiddenDeals(callback) {
  window.addEventListener(hiddenEventName, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(hiddenEventName, callback);
    window.removeEventListener('storage', callback);
  };
}

export function notifyHiddenDealsChanged() {
  window.dispatchEvent(new CustomEvent(hiddenEventName));
}
