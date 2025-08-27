'use client';

import { useEffect, useMemo, useState } from 'react';

type Provider = { id: number; name: string; email?: string | null; phone?: string | null; city?: string | null };
type RequestItem = { id: number; category?: string | null; description?: string | null; location?: string | null; status: string };
type Callout = { id: number; requestId: number; providerId: number; startTime: string | null; endTime: string | null; status: string; notes?: string | null; createdAt: string };

export default function AdminCalloutsPage() {
  const [adminKey, setAdminKey] = useState<string>('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // form state
  const [selRequestId, setSelRequestId] = useState<number | null>(null);
  const [selProviderId, setSelProviderId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<string>(''); // ISO local
  const [endTime, setEndTime] = useState<string>('');
  const [status, setStatus] = useState<string>('CONFIRMED');
  const [notes, setNotes] = useState<string>('');

  const headers = useMemo(() => ({ 'x-admin-key': adminKey }), [adminKey]);

  async function loadLists() {
    if (!adminKey) { setErr('Enter admin key'); return; }
    setErr(null); setLoading(true);
    try {
      const res = await fetch(`/api/admin/callouts?lists=1&take=100&ts=${Date.now()}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      setProviders(json.providers ?? []);
      setRequests(json.requests ?? []);
      if ((json.requests ?? []).length > 0 && selRequestId == null) {
        setSelRequestId(json.requests[0].id);
      }
      if ((json.providers ?? []).length > 0 && selProviderId == null) {
        setSelProviderId(json.providers[0].id);
      }
    } catch (e: any) {
      setErr(e.message || 'Failed to load lists');
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentCallouts() {
    if (!adminKey) return;
    try {
      const res = await fetch(`/api/admin/callouts?take=20&ts=${Date.now()}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      setCallouts(json.callouts ?? []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load callouts');
    }
  }

  async function scheduleCallout() {
    setErr(null); setLoading(true);
    try {
      if (!selRequestId || !selProviderId || !startTime) {
        throw new Error('Pick request, provider and start time');
      }
      const body = {
        requestId: selRequestId,
        providerId: selProviderId,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        status,
        notes: notes || undefined,
      };
      const res = await fetch('/api/admin/callouts', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      await loadRecentCallouts();
    } catch (e: any) {
      setErr(e.message || 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (adminKey) loadRecentCallouts(); }, [adminKey]);

  return (
    <div style={{ maxWidth: 860, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Admin: Schedule Callout</h1>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          placeholder="Paste ADMIN_API_KEY"
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          style={{ width: 420, padding: 6 }}
        />
        <button onClick={loadLists} disabled={!adminKey || loading}>Load Lists</button>
        <button onClick={loadRecentCallouts} disabled={!adminKey || loading}>Refresh</button>
      </div>

      {err && <p style={{ color: 'crimson', marginBottom: 12 }}>{err}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* left column: form */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <label>Request&nbsp;</label>
            <select
              value={selRequestId ?? ''}
              onChange={(e) => setSelRequestId(Number(e.target.value) || null)}
              style={{ width: '100%' }}
            >
              {requests.map(r => (
                <option key={r.id} value={r.id}>
                  #{r.id} — {r.category ?? '—'} ({r.status})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>Provider&nbsp;</label>
            <select
              value={selProviderId ?? ''}
              onChange={(e) => setSelProviderId(Number(e.target.value) || null)}
              style={{ width: '100%' }}
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.id} — {p.name}{p.email ? ` (${p.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>Start time&nbsp;</label>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>End time (optional)&nbsp;</label>
            <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>Status&nbsp;</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>Notes (optional)&nbsp;</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%' }} />
          </div>

          <button onClick={scheduleCallout} disabled={loading || !adminKey}>
            {loading ? 'Scheduling…' : 'Schedule callout'}
          </button>
        </div>

        {/* right column: recent callouts */}
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Recent Callouts</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th align="left">ID</th>
                <th align="left">Request</th>
                <th align="left">Provider</th>
                <th align="left">Start → End</th>
                <th align="left">Status</th>
              </tr>
            </thead>
            <tbody>
              {callouts.map(c => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>#{c.requestId}</td>
                  <td>#{c.providerId}</td>
                  <td>
                    {c.startTime ? new Date(c.startTime).toLocaleString() : '—'}
                    {' → '}
                    {c.endTime ? new Date(c.endTime).toLocaleString() : '—'}
                  </td>
                  <td>{c.status}</td>
                </tr>
              ))}
              {callouts.length === 0 && (
                <tr><td colSpan={5} style={{ opacity: 0.7 }}>No callouts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
