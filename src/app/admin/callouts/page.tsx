'use client';
import { useState } from 'react';

export default function AdminCalloutsPage() {
  const [adminKey, setAdminKey] = useState('');
  const [requestId, setRequestId] = useState<number | ''>('');
  const [providerId, setProviderId] = useState<number | ''>('');
  const [startTime, setStartTime] = useState<string>(''); // ISO
  const [endTime, setEndTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('Booked over phone');
  const [confirmedBy, setConfirmedBy] = useState<string>('phone');
  const [confirmationRef, setConfirmationRef] = useState<string>('');
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/admin/callouts', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({
        requestId: typeof requestId === 'string' ? Number(requestId) : requestId,
        providerId: typeof providerId === 'string' ? Number(providerId) : providerId,
        startTime,
        endTime: endTime || undefined,
        notes,
        confirmedBy,
        confirmationRef: confirmationRef || undefined,
      }),
    });
    const j = await res.json();
    setMsg(res.ok ? `Scheduled call-out id=${j.callout.id}` : j.error || 'Failed');
  }

  return (
    <main>
      <h2>Admin: Schedule Call-out</h2>
      <form onSubmit={submit} style={{ display:'grid', gap:8, maxWidth:500 }}>
        <input value={adminKey} onChange={e=>setAdminKey(e.target.value)} placeholder="ADMIN_API_KEY" />
        <input value={requestId as any} onChange={e=>setRequestId(e.target.value ? Number(e.target.value) : '')} placeholder="requestId" />
        <input value={providerId as any} onChange={e=>setProviderId(e.target.value ? Number(e.target.value) : '')} placeholder="providerId" />
        <input value={startTime} onChange={e=>setStartTime(e.target.value)} placeholder="startTime (ISO e.g. 2025-08-20T10:30:00Z)" />
        <input value={endTime} onChange={e=>setEndTime(e.target.value)} placeholder="endTime (ISO, optional)" />
        <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="notes" />
        <input value={confirmedBy} onChange={e=>setConfirmedBy(e.target.value)} placeholder="confirmedBy (phone|web|email|sms)" />
        <input value={confirmationRef} onChange={e=>setConfirmationRef(e.target.value)} placeholder="confirmation ref (optional)" />
        <button>Schedule</button>
        {msg && <p>{msg}</p>}
      </form>
    </main>
  );
}
