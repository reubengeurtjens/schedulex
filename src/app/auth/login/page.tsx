'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveToken, clearToken } from '@/lib/token';

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('hunter2hunter2');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, password }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(j.error || 'Login failed');
    clearToken(); saveToken(j.token);
    setMsg('Logged in! Redirecting to new request…');
    setTimeout(() => r.push('/request/new'), 500);
  }

  return (
    <main>
      <h2>Login</h2>
      <form onSubmit={submit} style={{ display:'grid', gap:8, maxWidth:400 }}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" />
        <button disabled={busy}>{busy ? '…' : 'Login'}</button>
        {msg && <p>{msg}</p>}
      </form>
      <p style={{marginTop:12}}><a onClick={()=>{clearToken(); alert('Token cleared');}} href="#">Clear token</a></p>
    </main>
  );
}
