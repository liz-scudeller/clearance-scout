const profileEventName = 'clearance-scout:user-profile';

export const defaultUserProfile = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  province: 'BC',
  postalCode: '',
  latitude: '',
  longitude: ''
};

function keyFor(userId) {
  return `clearance-scout:user-profile:${userId || 'guest'}`;
}

export function getUserProfile(userId) {
  try {
    return { ...defaultUserProfile, ...JSON.parse(localStorage.getItem(keyFor(userId)) || '{}') };
  } catch {
    return defaultUserProfile;
  }
}

export function saveUserProfile(userId, profile) {
  localStorage.setItem(keyFor(userId), JSON.stringify({ ...defaultUserProfile, ...profile }));
  window.dispatchEvent(new CustomEvent(profileEventName));
}

export function subscribeToUserProfile(callback) {
  window.addEventListener(profileEventName, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(profileEventName, callback);
    window.removeEventListener('storage', callback);
  };
}
