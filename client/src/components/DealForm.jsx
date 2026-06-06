import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createDeal } from '../services/api';
import { labelize } from '../utils/options';

const initialForm = {
  storeName: '',
  city: '',
  province: 'BC',
  saleType: 'store_closing',
  discountText: '',
  description: '',
  address: '',
  postalCode: '',
  mallName: '',
  sourceUrl: '',
  expiresAt: '',
  category: 'other',
  sourceType: 'user_report'
};

const saleTypes = [
  { value: 'store_closing', label: 'Store Closing' },
  { value: 'warehouse_sale', label: 'Warehouse' },
  { value: 'clearance', label: 'Clearance' },
  { value: 'relocation_sale', label: 'Relocation' },
  { value: 'final_sale', label: 'Final Sale' },
  { value: 'other', label: 'Other' }
];

const categories = ['sports', 'shoes', 'clothing', 'furniture', 'electronics', 'baby', 'home', 'tools', 'other'];

export default function DealForm() {
  const [step, setStep] = useState('report');
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const hasPhotoOrDetails = Boolean(image || form.discountText.trim() || form.description.trim());
  const title = useMemo(() => {
    const store = form.storeName.trim() || 'Local sale';
    const sale = labelize(form.saleType).replace('Store Closing', 'Closing');
    return `${store} ${sale}`.trim();
  }, [form.storeName, form.saleType]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function updateImage(file) {
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : '');
    setError('');
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setError('Location is not available on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          description: [current.description, `Reporter location: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`].filter(Boolean).join('\n')
        }));
      },
      () => setError('Could not get your location. You can type the city instead.')
    );
  }

  function reviewReport() {
    if (!form.storeName.trim()) {
      setError('Store name is required.');
      return;
    }
    if (!form.city.trim()) {
      setError('City or current location is required.');
      return;
    }
    if (!hasPhotoOrDetails) {
      setError('Add a photo or a quick description of the sale.');
      return;
    }
    setError('');
    setStep('review');
  }

  async function submitReport(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = new FormData();
    const description = buildDescription(form);
    const submitForm = {
      ...form,
      title,
      address: form.address || 'Address to verify',
      category: form.category || 'other',
      discountText: form.discountText || 'Deal details to verify',
      description,
      sourceType: 'user_report',
      startDate: '',
      expiresAt: form.expiresAt || ''
    };

    Object.entries(submitForm).forEach(([key, value]) => payload.append(key, value || ''));
    if (image) payload.append('image', image);

    try {
      await createDeal(payload);
      navigate('/deals');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submitReport} className="mx-auto min-h-screen max-w-md bg-app-paper px-5 pb-28 pt-6 md:my-6 md:rounded-[28px] md:shadow-2xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-deal-orange">Quick tip</p>
          <h1 className="mt-1 text-3xl font-black text-app-ink">Report a Sale</h1>
          <p className="mt-2 text-sm leading-6 text-app-text">Share a deal in under 30 seconds. We will review it before it appears.</p>
        </div>
        <Link to="/deals" className="grid h-10 w-10 place-items-center rounded-full bg-white text-2xl font-light text-app-ink shadow-sm">x</Link>
      </header>

      {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      {step === 'report' ? (
        <section className="mt-6 space-y-5">
          <div>
            <h2 className="text-base font-black text-app-ink">What did you find?</h2>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {saleTypes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, saleType: item.value }))}
                  className={`h-10 shrink-0 rounded-full border px-4 text-sm font-black ${form.saleType === item.value ? 'border-brand bg-brand text-white' : 'border-stone-200 bg-white text-app-ink'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Store name" name="storeName" value={form.storeName} onChange={updateField} placeholder="e.g. Sport Chek" required />

          <div>
            <label className="mb-2 block text-sm font-black text-app-ink">Location <span className="text-red-600">*</span></label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input name="city" value={form.city} onChange={updateField} placeholder="City, e.g. Burnaby" className={inputClass} />
              <button type="button" onClick={useLocation} className="rounded-xl border border-stone-200 bg-white px-3 text-sm font-black text-brand">Use my location</button>
            </div>
          </div>

          <PhotoPicker image={image} imagePreview={imagePreview} onChange={updateImage} />

          <Field label="Discount / details" name="discountText" value={form.discountText} onChange={updateField} placeholder="Up to 70% off, final days, everything must go" />

          <button type="button" onClick={() => setShowMore((current) => !current)} className="text-sm font-black text-brand">
            {showMore ? 'Hide optional details' : 'Add more details'}
          </button>

          {showMore && (
            <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
              <Field label="Address" name="address" value={form.address} onChange={updateField} placeholder="Street address" />
              <Field label="Mall / shopping centre" name="mallName" value={form.mallName} onChange={updateField} placeholder="The City of Lougheed" />
              <Field label="Source link" name="sourceUrl" value={form.sourceUrl} onChange={updateField} placeholder="https://..." type="url" />
              <Field label="End date" name="expiresAt" value={form.expiresAt} onChange={updateField} type="date" />
              <div>
                <label className="mb-2 block text-sm font-black text-app-ink">Category</label>
                <select name="category" value={form.category} onChange={updateField} className={inputClass}>
                  {categories.map((category) => <option key={category} value={category}>{labelize(category)}</option>)}
                </select>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-app-ink">Notes</span>
                <textarea name="description" value={form.description} onChange={updateField} rows="3" className={`${inputClass} min-h-24 py-3`} placeholder="Anything else useful?" />
              </label>
            </section>
          )}

          <button type="button" onClick={reviewReport} className="h-14 w-full rounded-xl bg-brand text-base font-black text-white shadow-sm">Review Report</button>
        </section>
      ) : (
        <section className="mt-6 space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className={`inline-flex rounded-md px-3 py-1.5 text-xs font-black uppercase text-white ${saleBadgeClass(form.saleType)}`}>{labelize(form.saleType)}</p>
            <h2 className="mt-4 text-2xl font-black leading-tight text-app-ink">{title}</h2>
            <p className="mt-2 text-base font-semibold text-app-text">{form.city}, {form.province}</p>
            <p className="mt-3 text-xl font-black text-deal-orange">{form.discountText || 'Deal details to verify'}</p>
            <p className="mt-3 text-sm font-medium text-app-text">{image ? 'Photo attached' : 'No photo attached'}</p>
          </div>

          {imagePreview && <img src={imagePreview} alt="Selected deal" className="h-40 w-full rounded-2xl object-cover shadow-sm" />}

          <div className="rounded-xl border border-orange-200 bg-[#FFF1E8] px-4 py-3 text-sm font-semibold leading-6 text-app-ink">
            This report will be reviewed before it appears in the app. AI/admin can enrich address, category, source, and details later.
          </div>

          <button type="button" onClick={() => setShowMore(true) || setStep('report')} className="text-left text-sm font-black text-brand">Add more details</button>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setStep('report')} className="h-14 rounded-xl border border-stone-200 bg-white text-base font-black text-app-ink">Back</button>
            <button disabled={saving} className="h-14 rounded-xl bg-brand text-base font-black text-white shadow-sm disabled:opacity-60">{saving ? 'Submitting...' : 'Submit Report'}</button>
          </div>
        </section>
      )}
    </form>
  );
}

function PhotoPicker({ image, imagePreview, onChange }) {
  return (
    <div>
      <p className="mb-2 text-sm font-black text-app-ink">Photo or description <span className="text-red-600">*</span></p>
      <label className="grid min-h-24 cursor-pointer place-items-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-4 text-center shadow-sm">
        <span className="text-sm font-black text-brand">{image ? image.name : 'Add a photo of the sale sign'}</span>
        <span className="mt-1 text-xs font-medium text-app-text">Optional if you add details below</span>
        <input type="file" accept="image/*" capture="environment" onChange={(event) => onChange(event.target.files?.[0] || null)} className="sr-only" />
      </label>
      {imagePreview && <img src={imagePreview} alt="Selected deal" className="mt-3 h-28 w-full rounded-xl object-cover" />}
    </div>
  );
}

function Field({ label, required = false, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-app-ink">{label} {required && <span className="text-red-600">*</span>}</span>
      <input {...props} className={inputClass} />
    </label>
  );
}

function buildDescription(form) {
  return [
    form.description,
    form.discountText,
    form.mallName ? `Mall / shopping centre: ${form.mallName}` : '',
    form.sourceUrl ? `Source: ${form.sourceUrl}` : ''
  ].filter(Boolean).join('\n\n') || 'Community sale report.';
}

function saleBadgeClass(saleType) {
  if (saleType === 'warehouse_sale') return 'bg-brand';
  if (saleType === 'clearance') return 'bg-deal-amber';
  return 'bg-deal-orange';
}

const inputClass = 'h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base font-medium text-app-ink outline-none placeholder:text-stone-400 focus:border-brand';
