'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const r = useRouter();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('hunter2hunter2');
  const [name, setName] = useState('Testy');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, password, name }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(j.error || 'Failed');
    setMsg('Registered! Redirecting to login…');
    setTimeout(() => r.push('/auth/login'), 600);
  }

  return (
    <main>
      <h2>Register</h2>
      <form onSubmit={submit} style={{ display:'grid', gap:8, maxWidth:400 }}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="name (optional)" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password (min 8)" type="password" />
        <button disabled={busy}>{busy ? '…' : 'Create account'}</button>
        {msg && <p>{msg}</p>}
      </form>
    </main>
  );
}
