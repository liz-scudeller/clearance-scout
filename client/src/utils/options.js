export const saleTypes = ['store_closing','clearance','warehouse_sale','relocation_sale','final_sale','floor_model_sale','other'];
export const categories = ['clothing','shoes','sports','furniture','home','electronics','toys','baby','beauty','grocery','tools','other'];
export const sourceTypes = ['user_report','official_site','flyer','facebook_link','reddit','event','other'];
export const dealStatuses = ['active','pending','rejected','expired','possibly_expired'];

const labels = {
  automated_scan: 'Automated Scan',
  automated_ai: 'AI Scanner',
  eventbrite_public_search: 'Eventbrite Public Search',
  manual_test: 'Manual Test',
  public_site: 'Public Site',
  user_report: 'User Report',
  facebook_link: 'Facebook Link'
};

export function labelize(value) {
  if (!value) return '';
  if (labels[value]) return labels[value];
  return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
