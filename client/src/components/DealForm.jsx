import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createDeal } from '../services/api';
import { labelize } from '../utils/options';

const initialForm = {
  title: '',
  storeName: '',
  address: '',
  city: '',
  province: 'BC',
  postalCode: '',
  category: 'sports',
  saleType: 'store_closing',
  discountText: '',
  description: '',
  sourceType: 'user_report',
  sourceUrl: '',
  startDate: '',
  expiresAt: '',
  mallName: '',
  confidence: 'high',
  notSureEnd: false
};

const saleTypeCards = [
  { value: 'store_closing', label: 'Store closing', icon: 'store', tone: 'orange' },
  { value: 'warehouse_sale', label: 'Warehouse sale', icon: 'warehouse', tone: 'blue' },
  { value: 'clearance', label: 'Clearance', icon: 'tag', tone: 'green' },
  { value: 'relocation_sale', label: 'Relocation sale', icon: 'pin', tone: 'purple' },
  { value: 'final_sale', label: 'Final sale', icon: 'bag', tone: 'red' },
  { value: 'other', label: 'Other', icon: 'more', tone: 'gray' }
];

const categoryPills = [
  { value: 'sports', label: 'Sports', icon: 'activity', tone: 'green' },
  { value: 'shoes', label: 'Shoes', icon: 'shoe', tone: 'orange' },
  { value: 'clothing', label: 'Clothing', icon: 'shirt', tone: 'purple' },
  { value: 'furniture', label: 'Furniture', icon: 'chair', tone: 'amber' },
  { value: 'electronics', label: 'Electronics', icon: 'monitor', tone: 'blue' },
  { value: 'baby', label: 'Baby', icon: 'stroller', tone: 'pink' },
  { value: 'home', label: 'Home', icon: 'home', tone: 'teal' },
  { value: 'other', label: 'Other', icon: 'more', tone: 'gray' }
];

export default function DealForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [confirmed, setConfirmed] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const selectedSaleType = saleTypeCards.find((item) => item.value === form.saleType) || saleTypeCards[0];
  const selectedCategory = categoryPills.find((item) => item.value === form.category) || categoryPills[0];

  const reviewDescription = useMemo(() => {
    const lines = [
      form.description,
      form.mallName ? `Mall / shopping centre: ${form.mallName}` : '',
      form.confidence ? `Reporter confidence: ${labelize(form.confidence)}` : '',
      form.notSureEnd ? 'End date: Not sure' : ''
    ].filter(Boolean);
    return lines.join('\n\n') || form.discountText || 'Community sale report.';
  }, [form.description, form.mallName, form.confidence, form.notSureEnd, form.discountText]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  function updateImage(file) {
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : '');
  }

  function goNext() {
    setError('');
    if (step === 1 && (!form.storeName || !form.city || !form.discountText)) {
      setError('Store name, city, and discount/details are required.');
      return;
    }
    if (step === 2 && !form.address) {
      setError('Address is required before review.');
      return;
    }
    setStep(Math.min(step + 1, 3));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!confirmed) {
      setError('Please confirm the information is accurate before submitting.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = new FormData();
    const title = form.title || `${form.storeName} ${labelize(form.saleType)}${form.city ? ` in ${form.city}` : ''}`;
    const submitForm = {
      ...form,
      title,
      description: reviewDescription,
      expiresAt: form.notSureEnd ? '' : form.expiresAt
    };
    Object.entries(submitForm).forEach(([key, value]) => payload.append(key, value));
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
    <form onSubmit={handleSubmit} className="mx-auto min-h-screen max-w-md bg-white px-5 pb-10 pt-10 md:my-6 md:rounded-[28px] md:shadow-2xl">
      <div className="relative text-center">
        <Link to="/deals" className="absolute left-0 top-4 grid h-10 w-10 place-items-center rounded-full text-2xl font-light leading-none text-app-ink hover:bg-stone-100">x</Link>
        <h1 className="pt-14 text-[34px] font-black leading-none tracking-tight text-app-ink">Report a Sale</h1>
        <p className="mx-auto mt-4 max-w-xs text-lg leading-7 text-stone-600">{stepSubtitle(step)}</p>
        <StepIndicator step={step} />
      </div>

      {error && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      {step === 1 && (
        <section className="mt-8 space-y-5">
          <h2 className="text-xl font-black text-app-ink">What did you find?</h2>
          <div className="grid grid-cols-2 gap-3">
            {saleTypeCards.map((saleType) => (
              <SelectionCard
                key={saleType.value}
                active={form.saleType === saleType.value}
                item={saleType}
                onClick={() => setForm({ ...form, saleType: saleType.value })}
              />
            ))}
          </div>

          <TextInput label="Store name" name="storeName" value={form.storeName} onChange={updateField} placeholder="e.g. Sport Chek" required />
          <div>
            <label className="mb-2 block text-sm font-black text-app-ink">City <span className="text-red-600">*</span></label>
            <div className="grid grid-cols-[1fr_52px] gap-3">
              <input name="city" value={form.city} onChange={updateField} placeholder="e.g. Burnaby" required className={inputClass} />
              <button type="button" className="grid place-items-center rounded-xl border border-stone-200 text-brand">
                <LineIcon name="pin" />
              </button>
            </div>
          </div>
          <PhotoPicker image={image} imagePreview={imagePreview} onChange={updateImage} />
          <TextArea label="Discount / details" name="discountText" value={form.discountText} onChange={updateField} placeholder="e.g. Up to 70% off on select items..." required />
          <TextInput label="Source link (optional)" name="sourceUrl" value={form.sourceUrl} onChange={updateField} placeholder="e.g. https://..." type="url" />
          <PrimaryButton type="button" onClick={goNext}>Next Step</PrimaryButton>
        </section>
      )}

      {step === 2 && (
        <section className="mt-8 space-y-7">
          <div>
            <h2 className="text-xl font-black text-app-ink">Where is the sale?</h2>
            <div className="mt-4 space-y-4">
              <IconInput icon="pin" name="address" value={form.address} onChange={updateField} placeholder="Address" required />
              <IconInput icon="building" name="mallName" value={form.mallName} onChange={updateField} placeholder="Mall / Shopping Centre (optional)" />
              <IconInput icon="mail" name="postalCode" value={form.postalCode} onChange={updateField} placeholder="Postal code" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-app-ink">What categories apply?</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {categoryPills.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: category.value })}
                  className={`flex h-12 items-center justify-center gap-2 rounded-full border text-sm font-bold ${form.category === category.value ? 'border-brand bg-[#F1FAF5] text-brand' : 'border-stone-200 bg-white text-app-ink'}`}
                >
                  <span className={`grid h-7 w-7 place-items-center rounded-full ${toneClass(category.tone)}`}><LineIcon name={category.icon} size={16} /></span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-app-ink">When did you see it?</h2>
            <IconInput icon="calendar" name="startDate" value={form.startDate} onChange={updateField} type="date" placeholder="Select date" />
          </div>

          <div>
            <h2 className="text-xl font-black text-app-ink">When does it end? <span className="font-medium">(optional)</span></h2>
            <div className="mt-4 grid grid-cols-[1fr_132px] gap-4">
              <IconInput icon="calendar" name="expiresAt" value={form.expiresAt} onChange={updateField} type="date" placeholder="Select date" disabled={form.notSureEnd} />
              <button type="button" onClick={() => setForm({ ...form, notSureEnd: !form.notSureEnd, expiresAt: '' })} className={`rounded-xl border text-sm font-black ${form.notSureEnd ? 'border-brand bg-[#F1FAF5] text-brand' : 'border-stone-200 bg-white text-app-ink'}`}>Not sure</button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-app-ink">How confident are you?</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {['high', 'medium', 'low'].map((confidence) => (
                <button key={confidence} type="button" onClick={() => setForm({ ...form, confidence })} className={`rounded-xl border px-3 py-4 text-center ${form.confidence === confidence ? 'border-brand bg-[#F1FAF5]' : 'border-stone-200 bg-white'}`}>
                  <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-white ${confidence === 'high' ? 'bg-brand' : confidence === 'medium' ? 'bg-deal-amber' : 'bg-red-500'}`}><LineIcon name="shield" size={16} /></span>
                  <span className="mt-2 block text-sm font-black capitalize text-app-ink">{confidence}</span>
                  <span className="block text-xs text-stone-500">{confidenceHelp(confidence)}</span>
                </button>
              ))}
            </div>
          </div>

          <TextArea label="Anything else? (optional)" name="description" value={form.description} onChange={updateField} placeholder="Add any extra details or notes..." maxLength="300" />
          <div className="grid grid-cols-2 gap-4">
            <SecondaryButton type="button" onClick={() => setStep(1)}>Back</SecondaryButton>
            <PrimaryButton type="button" onClick={goNext}>Next Step</PrimaryButton>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-10 space-y-5">
          <ReviewSaleType item={selectedSaleType} />
          <ReviewDetails form={form} />
          <ReviewCategories item={selectedCategory} />
          <ReviewBlock title="Discount / details">{form.discountText || 'Not provided'}</ReviewBlock>
          <ReviewPhoto imagePreview={imagePreview} />
          <ReviewBlock title="Source link">{form.sourceUrl || 'No source link provided'}</ReviewBlock>

          <div className="rounded-xl border border-orange-200 bg-[#FFF7EC] px-5 py-4 text-base font-medium text-app-ink">
            Your report will be reviewed before it appears in the app.
          </div>

          <label className="flex items-start gap-4 text-lg font-medium text-app-ink">
            <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" className="mt-1 h-8 w-8 accent-brand" />
            I confirm that this information is accurate to the best of my knowledge.
          </label>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <SecondaryButton type="button" onClick={() => setStep(2)}>Back</SecondaryButton>
            <PrimaryButton disabled={saving}>{saving ? 'Submitting...' : 'Submit Report'}</PrimaryButton>
          </div>
        </section>
      )}
    </form>
  );
}

function StepIndicator({ step }) {
  return (
    <div className="mx-auto mt-8 grid w-56 grid-cols-[40px_1fr_40px_1fr_40px] items-center">
      {[1, 2, 3].map((item, index) => (
        <StepNode key={item} item={item} active={step === item} index={index} />
      ))}
    </div>
  );
}

function StepNode({ item, active, index }) {
  return (
    <>
      {index > 0 && <span className="-mx-1 h-px bg-stone-300" />}
      <span className={`grid h-10 w-10 place-items-center rounded-full border text-base font-black ${active ? 'border-brand bg-brand text-white shadow-lg shadow-brand/20' : 'border-stone-300 bg-white text-app-ink'}`}>{item}</span>
    </>
  );
}

function SelectionCard({ item, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`h-28 rounded-2xl border p-3 text-center transition ${active ? 'border-brand bg-[#F1FAF5] shadow-sm' : `${cardBorderClass(item.tone)} hover:border-stone-300`}`}>
      <span className={`mx-auto grid h-10 w-10 place-items-center rounded-full ${toneClass(item.tone)}`}><LineIcon name={item.icon} size={20} /></span>
      <span className="mt-3 block text-sm font-black text-app-ink">{item.label}</span>
    </button>
  );
}

function PhotoPicker({ image, imagePreview, onChange }) {
  return (
    <div>
      <p className="mb-3 text-sm font-black text-app-ink">Add a photo (optional)</p>
      <label className="grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/40 px-4 py-5 text-center transition hover:bg-stone-50">
        <span className="text-app-ink"><LineIcon name="camera" size={28} /></span>
        <span className="mt-2 text-sm font-semibold text-stone-500">{image ? image.name : 'Tap to add photo'}</span>
        <input type="file" accept="image/*" capture="environment" onChange={(event) => onChange(event.target.files?.[0] || null)} className="sr-only" />
      </label>
      {imagePreview && <img src={imagePreview} alt="Selected deal" className="mt-3 h-32 w-full rounded-xl border border-stone-200 object-cover" />}
    </div>
  );
}

function TextInput({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-app-ink">{label} {props.required && <span className="text-red-600">*</span>}</span>
      <input {...props} className={inputClass} />
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-app-ink">{label} {props.required && <span className="text-red-600">*</span>}</span>
      <textarea {...props} rows={props.rows || 4} className={`${inputClass} min-h-28 resize-none py-4`} />
    </label>
  );
}

function IconInput({ icon, ...props }) {
  return (
    <label className="relative block">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500"><LineIcon name={icon} size={18} /></span>
      <input {...props} className={`${inputClass} pl-14`} />
    </label>
  );
}

function ReviewSaleType({ item }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-[130px_64px_1fr] items-center gap-3">
        <h2 className="text-xl font-black text-app-ink">Sale type</h2>
        <span className={`grid h-12 w-12 place-items-center rounded-full ${toneClass(item.tone)}`}><LineIcon name={item.icon} size={22} /></span>
        <p className="text-xl font-medium text-app-ink">{item.label}</p>
      </div>
    </div>
  );
}

function ReviewDetails({ form }) {
  const rows = [
    ['Store name', form.storeName],
    ['City', form.city],
    ['Address', form.address],
    ['Mall / Shopping Centre', form.mallName || 'Not provided'],
    ['Date seen', form.startDate || 'Today'],
    ['End date', form.notSureEnd ? 'Not sure' : form.expiresAt || 'Not sure'],
    ['Confidence', labelize(form.confidence)]
  ];
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-app-ink">Store details</h2>
      <div className="mt-4 divide-y divide-stone-200">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[1fr_1.2fr] gap-3 py-3 text-lg">
            <span className="text-stone-500">{label}</span>
            <span className={`text-right font-medium ${label === 'Confidence' ? 'text-brand' : 'text-app-ink'}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCategories({ item }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-app-ink">Categories</h2>
      <span className="mt-4 inline-flex items-center gap-3 rounded-full border border-stone-200 px-5 py-3 text-lg font-medium text-app-ink">
        <span className={`grid h-8 w-8 place-items-center rounded-full ${toneClass(item.tone)}`}><LineIcon name={item.icon} size={16} /></span>
        {item.label}
      </span>
    </div>
  );
}

function ReviewBlock({ title, children }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-app-ink">{title}</h2>
      <p className="mt-2 break-words text-lg text-stone-600">{children}</p>
    </div>
  );
}

function ReviewPhoto({ imagePreview }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-app-ink">Photo</h2>
      {imagePreview ? <img src={imagePreview} alt="Selected deal" className="mt-3 h-24 w-40 rounded-lg object-cover" /> : <p className="mt-2 text-lg text-stone-600">No photo added</p>}
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return <button {...props} className="min-h-14 w-full rounded-xl bg-brand px-4 py-4 text-base font-black text-white shadow-sm shadow-brand/20 disabled:opacity-60">{children}</button>;
}

function SecondaryButton({ children, ...props }) {
  return <button {...props} className="min-h-14 w-full rounded-xl border border-brand-700 bg-white px-4 py-4 text-base font-black text-app-ink">{children}</button>;
}

function stepSubtitle(step) {
  if (step === 1) return 'Help others find great deals in your area.';
  if (step === 2) return 'Add a few more details.';
  return 'Review and submit your report.';
}

function confidenceHelp(value) {
  if (value === 'high') return 'Very sure';
  if (value === 'medium') return 'Somewhat sure';
  return 'Not sure';
}

function toneClass(tone) {
  const classes = {
    orange: 'bg-orange-100 text-deal-orange',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-800',
    pink: 'bg-pink-100 text-pink-600',
    teal: 'bg-teal-100 text-teal-700',
    gray: 'bg-stone-100 text-stone-700'
  };
  return classes[tone] || classes.gray;
}

function cardBorderClass(tone) {
  const classes = {
    orange: 'border-orange-200 bg-orange-50/20',
    blue: 'border-blue-200 bg-blue-50/20',
    green: 'border-green-200 bg-green-50/20',
    purple: 'border-purple-200 bg-purple-50/20',
    red: 'border-red-200 bg-red-50/20',
    gray: 'border-stone-200 bg-white'
  };
  return classes[tone] || classes.gray;
}

function LineIcon({ name, size = 20 }) {
  const common = { stroke: 'currentColor', strokeWidth: 2.1, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    store: <><path {...common} d="M4 10h16l-1.5-5h-13L4 10Z" /><path {...common} d="M6 10v9h12v-9M9 19v-5h6v5" /></>,
    warehouse: <><path {...common} d="M4 20V9l8-4 8 4v11" /><path {...common} d="M8 20v-7h8v7M8 13h8M8 16h8" /></>,
    tag: <><path {...common} d="M4 12V5h7l9 9-6 6-10-8Z" /><path {...common} d="M8.5 8.5h.01" /></>,
    pin: <><path {...common} d="M12 21s6-4.5 6-11a6 6 0 0 0-12 0c0 6.5 6 11 6 11Z" /><path {...common} d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /></>,
    bag: <><path {...common} d="M7 8h10v12H7V8Z" /><path {...common} d="M9 8a3 3 0 0 1 6 0" /></>,
    more: <><path {...common} d="M6 12h.01M12 12h.01M18 12h.01" /></>,
    activity: <><path {...common} d="M13 4 8 12h5l-2 8 5-10h-5l2-6Z" /></>,
    shoe: <><path {...common} d="M5 14c3 1 6 1 9-2l5 3v3H6c-2 0-3-1-3-2v-2h2Z" /></>,
    shirt: <><path {...common} d="M8 4 5 6 3 10l4 2v8h10v-8l4-2-2-4-3-2-4 3-4-3Z" /></>,
    chair: <><path {...common} d="M7 11h10v5H7zM9 16v4M15 16v4M8 11V7a4 4 0 0 1 8 0v4" /></>,
    monitor: <><path {...common} d="M4 5h16v11H4zM9 20h6M12 16v4" /></>,
    stroller: <><path {...common} d="M7 13h10l2-6H6l1 6ZM8 17h.01M17 17h.01M8 13l-2 4h13" /></>,
    home: <><path {...common} d="M4 11 12 4l8 7v9H6v-9" /></>,
    calendar: <><path {...common} d="M5 5h14v15H5zM8 3v4M16 3v4M5 10h14" /></>,
    building: <><path {...common} d="M5 21V5h9v16M14 9h5v12M8 9h3M8 13h3M8 17h3" /></>,
    mail: <><path {...common} d="M4 6h16v12H4zM4 7l8 6 8-6" /></>,
    shield: <><path {...common} d="M12 3 19 6v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3Z" /></>,
    camera: <><path {...common} d="M5 8h3l2-3h4l2 3h3v11H5z" /><path {...common} d="M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /></>
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {paths[name] || paths.more}
    </svg>
  );
}

const inputClass = 'h-14 w-full rounded-xl border border-stone-200 bg-white px-4 text-base font-medium text-app-ink outline-none placeholder:text-stone-400 focus:border-brand';
