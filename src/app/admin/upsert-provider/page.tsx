'use client';
import { useState } from 'react';

export default function UpsertProviderPage() {
  const [name, setName] = useState('Rapid Plumbing');
  const [phone, setPhone] = useState('+6112345678');
  const [address, setAddress] = useState('123 Main St');
  const [category, setCategory] = useState('plumbing');
  const [website, setWebsite] = useState('');
  const [services, setServices] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/admin/providers/upsert', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ name, phone, address, category, website, services }),
    });
    const j = await res.json();
    setMsg(res.ok ? `Upserted provider id=${j.provider.id}` : j.error || 'Failed');
  }

  return (
    <main>
      <h2>Admin: Upsert Provider</h2>
      <form onSubmit={submit} style={{ display:'grid', gap:8, maxWidth:500 }}>
        <input value={adminKey} onChange={e=>setAdminKey(e.target.value)} placeholder="ADMIN_API_KEY" />
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="name" />
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="phone" />
        <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="address" />
        <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="category" />
        <input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="website" />
        <input value={services} onChange={e=>setServices(e.target.value)} placeholder="services (optional)" />
        <button>Save</button>
        {msg && <p>{msg}</p>}
      </form>
    </main>
  );
}
