'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/token';

export default function NewRequestPage() {
  const r = useRouter();
  const [category, setCategory] = useState('plumbing');
  const [description, setDescription] = useState('Burst pipe in laundry');
  const [address, setAddress] = useState('45 Queen St');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return setMsg('Please login first.');
    setBusy(true); setMsg(null);
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ category, description, address }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(j.error || 'Failed');
    setMsg('Request created. Opening status…');
    setTimeout(() => r.push(`/request/${j.request.id}`), 600);
  }

  return (
    <main>
      <h2>New Request</h2>
      <form onSubmit={submit} style={{ display:'grid', gap:8, maxWidth:500 }}>
        <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="category (e.g., plumbing)" />
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="describe the issue" rows={4} />
        <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="address" />
        <button disabled={busy}>{busy ? '…' : 'Create request'}</button>
        {msg && <p>{msg}</p>}
      </form>
    </main>
  );
}
