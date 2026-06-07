import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMyProfile, updateMyProfile } from '../services/api';
import { getUserProfile, saveUserProfile } from '../services/userProfile';

export default function Profile() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const [profile, setProfile] = useState(() => getUserProfile(userId));
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = getUserProfile(userId);
    setProfile({
      ...stored,
      fullName: stored.fullName || user?.user_metadata?.full_name || ''
    });
  }, [userId, user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getMyProfile()
      .then((data) => {
        if (!active) return;
        const nextProfile = {
          ...data.profile,
          fullName: data.profile?.fullName || user?.user_metadata?.full_name || ''
        };
        setProfile(nextProfile);
        saveUserProfile(userId, nextProfile);
      })
      .catch((error) => setMessage(error.message));
    return () => {
      active = false;
    };
  }, [user, userId]);

  const addressLine = useMemo(() => {
    const values = [profile.address, profile.city, profile.province, profile.postalCode].filter(Boolean);
    return values.length ? values.join(', ') : 'No address set';
  }, [profile]);

  function updateField(field, value) {
    setMessage('');
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    try {
      if (user) {
        const data = await updateMyProfile(profile);
        saveUserProfile(userId, data.profile);
        setProfile(data.profile);
      } else {
        saveUserProfile(userId, profile);
      }
      setMessage('Profile saved.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-6 md:max-w-3xl md:pb-10">
      <header>
        <p className="text-xs font-semibold uppercase text-deal-amber">Account</p>
        <h1 className="mt-1 text-3xl font-black text-brand-700">Your Profile</h1>
        <p className="mt-2 text-base text-stone-600">{addressLine}</p>
      </header>

      <form onSubmit={saveProfile} className="mt-6 grid gap-5">
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-app-ink">Personal info</h2>
          <div className="mt-4 grid gap-4">
            <Field label="Full name" value={profile.fullName} onChange={(value) => updateField('fullName', value)} autoComplete="name" />
            <Field label="Phone" value={profile.phone} onChange={(value) => updateField('phone', value)} autoComplete="tel" inputMode="tel" />
            <label className="block">
              <span className="text-sm font-black text-app-ink">Email</span>
              <input value={user?.email || ''} disabled className="mt-2 h-12 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-500" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-app-ink">Home address</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">Nearby deals will use this address as the starting point.</p>
          <div className="mt-4 grid gap-4">
            <Field label="Street address" value={profile.address} onChange={(value) => updateField('address', value)} autoComplete="street-address" required />
            <div className="grid grid-cols-[1fr_88px] gap-3">
              <Field label="City" value={profile.city} onChange={(value) => updateField('city', value)} autoComplete="address-level2" required />
              <Field label="Province" value={profile.province} onChange={(value) => updateField('province', value.toUpperCase())} autoComplete="address-level1" maxLength={2} required />
            </div>
            <Field label="Postal code" value={profile.postalCode} onChange={(value) => updateField('postalCode', value.toUpperCase())} autoComplete="postal-code" required />
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-app-ink">Location coordinates</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">Optional for now. Later this can make distance sorting exact.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Latitude" value={profile.latitude} onChange={(value) => updateField('latitude', value)} inputMode="decimal" />
            <Field label="Longitude" value={profile.longitude} onChange={(value) => updateField('longitude', value)} inputMode="decimal" />
          </div>
        </section>

        {message && <p className="rounded-xl bg-[#E1F3EA] px-4 py-3 text-sm font-semibold text-brand">{message}</p>}

        <button className="h-14 rounded-2xl bg-brand text-base font-black text-white shadow-sm">Save Profile</button>
        <Link to="/deals" className="text-center text-sm font-black text-brand">Back to deals</Link>
      </form>
    </main>
  );
}

function Field({ label, value, onChange, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-app-ink">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-stone-200 px-3 text-base text-app-ink outline-none focus:border-brand"
        {...props}
      />
    </label>
  );
}
