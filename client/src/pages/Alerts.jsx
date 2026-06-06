import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { defaultAlertPreferences, getAlertPreferences, saveAlertPreferences } from '../services/alertPreferences';
import { categories, labelize, saleTypes } from '../utils/options';

const mainCategories = categories.filter((category) => !['other'].includes(category));
const mainSaleTypes = saleTypes.filter((type) => !['other', 'final_sale', 'floor_model_sale'].includes(type));

export default function Alerts() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const [preferences, setPreferences] = useState(() => getAlertPreferences(userId));
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPreferences(getAlertPreferences(userId));
  }, [userId]);

  const summary = useMemo(() => {
    if (!preferences.enabled) return 'Alerts are paused.';
    const categoryCount = preferences.categories.length;
    const saleTypeCount = preferences.saleTypes.length;
    return `${categoryCount} categories, ${saleTypeCount} sale types, ${preferences.radius} km radius`;
  }, [preferences]);

  function updateField(field, value) {
    setMessage('');
    setPreferences((current) => ({ ...current, [field]: value }));
  }

  function toggleListValue(field, value) {
    setMessage('');
    setPreferences((current) => {
      const values = current[field] || [];
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
      return { ...current, [field]: nextValues };
    });
  }

  function savePreferences() {
    const nextPreferences = {
      ...defaultAlertPreferences,
      ...preferences,
      categories: preferences.categories.length ? preferences.categories : defaultAlertPreferences.categories,
      saleTypes: preferences.saleTypes.length ? preferences.saleTypes : defaultAlertPreferences.saleTypes
    };
    saveAlertPreferences(userId, nextPreferences);
    setPreferences(nextPreferences);
    setMessage('Alert preferences saved.');
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-6 md:max-w-3xl md:pb-10">
      <header>
        <p className="text-xs font-semibold uppercase text-deal-amber">Notifications</p>
        <h1 className="mt-1 text-3xl font-black text-brand-700">Alerts</h1>
        <p className="mt-2 text-base text-stone-600">{summary}</p>
      </header>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-app-ink">Deal alerts</h2>
            <p className="mt-1 text-sm text-stone-600">Get notified when matching deals show up.</p>
          </div>
          <button
            onClick={() => updateField('enabled', !preferences.enabled)}
            className={`relative h-8 w-14 rounded-full transition ${preferences.enabled ? 'bg-brand' : 'bg-stone-300'}`}
            aria-label={preferences.enabled ? 'Pause alerts' : 'Turn on alerts'}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${preferences.enabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-app-ink">Alert me about</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {mainCategories.map((category) => (
            <Chip
              key={category}
              active={preferences.categories.includes(category)}
              label={labelize(category)}
              onClick={() => toggleListValue('categories', category)}
            />
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-app-ink">Sale types</h2>
        <div className="mt-4 grid gap-2">
          {mainSaleTypes.map((type) => (
            <Chip
              key={type}
              active={preferences.saleTypes.includes(type)}
              label={labelize(type)}
              onClick={() => toggleListValue('saleTypes', type)}
            />
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="text-sm font-black text-app-ink">Distance</span>
          <select value={preferences.radius} onChange={(event) => updateField('radius', event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-stone-200 px-3 text-base text-app-ink">
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-black text-app-ink">Minimum confidence</span>
          <select value={preferences.minimumConfidence} onChange={(event) => updateField('minimumConfidence', event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-stone-200 px-3 text-base text-app-ink">
            <option value="0">Any deal</option>
            <option value="60">Medium and high</option>
            <option value="80">High confidence only</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-black text-app-ink">Cities</span>
          <input
            value={preferences.cities}
            onChange={(event) => updateField('cities', event.target.value)}
            placeholder="Vancouver, Burnaby, Richmond"
            className="mt-2 h-12 w-full rounded-xl border border-stone-200 px-3 text-base text-app-ink outline-none focus:border-brand"
          />
        </label>
      </section>

      {message && <p className="mt-4 rounded-xl bg-[#E1F3EA] px-4 py-3 text-sm font-semibold text-brand">{message}</p>}
      <button onClick={savePreferences} className="mt-5 h-14 w-full rounded-2xl bg-brand text-base font-black text-white shadow-sm">
        Save Alerts
      </button>
    </main>
  );
}

function Chip({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-bold ${active ? 'border-brand bg-brand text-white' : 'border-stone-200 bg-[#FBF7F3] text-app-ink'}`}
    >
      {label}
    </button>
  );
}
