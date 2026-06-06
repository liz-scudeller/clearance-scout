import { categories, dealStatuses, labelize, saleTypes } from '../utils/options';

export default function DealFilters({ filters, onChange }) {
  function updateField(event) {
    onChange({ ...filters, [event.target.name]: event.target.value });
  }

  return (
    <section className="grid gap-3 rounded border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-medium text-ink">City<input name="city" value={filters.city || ''} onChange={updateField} placeholder="Burnaby" className="mt-1 w-full rounded border border-stone-300 px-3 py-2" /></label>
      <Select label="Category" name="category" value={filters.category || ''} onChange={updateField} options={categories} empty="All categories" />
      <Select label="Sale Type" name="saleType" value={filters.saleType || ''} onChange={updateField} options={saleTypes} empty="All sale types" />
      <Select label="Status" name="status" value={filters.status || 'active'} onChange={updateField} options={dealStatuses} empty="All statuses" />
    </section>
  );
}

function Select({ label, options, empty, ...props }) {
  return (
    <label className="text-sm font-medium text-ink">
      {label}
      <select {...props} className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
        <option value="">{empty}</option>
        {options.map((option) => <option key={option} value={option}>{labelize(option)}</option>)}
      </select>
    </label>
  );
}
