export function labelize(value) {
  if (!value) return '';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeText(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
