'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getToken } from '@/lib/token';

type Callout = {
  id: number;
  provider: { id: number; name: string; phone: string|null; address: string|null; category: string|null };
  startTime: string;
  endTime: string | null;
  status: string;
  notes: string | null;
  confirmationRef: string | null;
  createdAt: string;
};

export default function RequestStatusPage() {
  const params = useParams<{ id: string }>();
  const r = useRouter();
  const [data, setData] = useState<{ count: number; callouts: Callout[] } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [cBusy, setCBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/requests/${params.id}/callouts`, { cache: 'no-store' });
    const j = await res.json();
    setData(j);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // poll every 5s
    return () => clearInterval(t);
  }, [params.id]);

  async function cancel() {
    const token = getToken();
    if (!token) { setMsg('Please login first.'); return; }
    setCBusy(true);
    const res = await fetch(`/api/requests/${params.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reason: 'user_cancelled' }),
    });
    setCBusy(false);
    const j = await res.json();
    if (!res.ok) setMsg(j.error || 'Cancel failed');
    else { setMsg('Cancelled'); setTimeout(() => r.push('/'), 800); }
  }

  return (
    <main>
      <h2>Request #{params.id}</h2>
      <p>We’ll schedule the earliest on-site quote and list it here.</p>
      <button onClick={load} style={{marginBottom:10}}>Refresh</button>
      {data?.callouts?.length ? (
        <ul style={{ display:'grid', gap:10 }}>
          {data.callouts.map(c => (
            <li key={c.id} style={{ border:'1px solid #ddd', padding:12, borderRadius:12 }}>
              <div><b>Provider:</b> {c.provider.name}</div>
              {c.provider.phone && <div><b>Phone:</b> {c.provider.phone}</div>}
              {c.provider.address && <div><b>Address:</b> {c.provider.address}</div>}
              <div><b>When:</b> {new Date(c.startTime).toLocaleString()} {c.endTime ? `– ${new Date(c.endTime).toLocaleTimeString()}` : ''}</div>
              <div><b>Status:</b> {c.status}</div>
              {c.confirmationRef && <div><b>Ref:</b> {c.confirmationRef}</div>}
              {c.notes && <div><b>Notes:</b> {c.notes}</div>}
            </li>
          ))}
        </ul>
      ) : <p>No call-outs yet. We’re working on it…</p>}
      <div style={{marginTop:16}}>
        <button onClick={cancel} disabled={cBusy}>{cBusy ? '…' : 'Cancel request'}</button>
        {msg && <p>{msg}</p>}
      </div>
    </main>
  );
}
