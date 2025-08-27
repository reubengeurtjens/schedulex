"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";

type Provider = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  timezone: string | null;
  notes: string | null;
};

export default function ProvidersUpsertPage() {
  const [adminKey, setAdminKey] = useState("");
  const [id, setId] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [q, setQ] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [out, setOut] = useState("");

  const onText =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setter(e.target.value);

  async function loadProviders() {
    setOut("Loading providers…");
    const url =
      `/api/admin/providers-upsert?take=50` +
      (q ? `&q=${encodeURIComponent(q)}` : "") +
      `&ts=${Date.now()}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "x-admin-key": adminKey.trim(), // send admin key for GET if middleware requires it
      },
    });

    const text = await res.text();
    if (!res.ok) {
      setOut(`Load failed: HTTP ${res.status}\n${text}`);
      setProviders([]);
      return;
    }
    try {
      const j = JSON.parse(text);
      setProviders(Array.isArray(j.providers) ? j.providers : []);
      setOut(`Loaded ${j.providers?.length ?? 0} provider(s).`);
    } catch {
      setOut(`Load failed: invalid JSON\n${text}`);
      setProviders([]);
    }
  }

  useEffect(() => {
    // wait until admin pastes the key, then click "Load Providers"
  }, []);

  function pick(p: Provider) {
    setId(String(p.id ?? ""));
    setName(p.name ?? "");
    setEmail(p.email ?? "");
    setPhone(p.phone ?? "");
    setCity(p.city ?? "");
    setTimezone(p.timezone ?? "");
    setNotes(p.notes ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setOut("Submitting…");

    const body: any = {
      name: name.trim(),
      ...(id.trim() ? { id: Number(id) } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(city.trim() ? { city: city.trim() } : {}),
      ...(timezone.trim() ? { timezone: timezone.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    const res = await fetch("/api/admin/providers-upsert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey.trim(),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    setOut(`HTTP ${res.status}\n${text}`);

    if (res.ok) {
      await loadProviders();
      // optional: clear form
      setId("");
      setName("");
      setEmail("");
      setPhone("");
      setCity("");
      setTimezone("");
      setNotes("");
    }
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "2rem auto",
        padding: 16,
        display: "grid",
        gap: 24,
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      {/* LEFT: form */}
      <section>
        <h1>Admin: Upsert Provider</h1>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="ADMIN_API_KEY (required)"
            value={adminKey}
            onChange={onText(setAdminKey)}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={loadProviders}>
              Load Providers
            </button>
            <input
              placeholder="search name/email/phone/city"
              value={q}
              onChange={onText(setQ)}
              style={{ flex: 1 }}
            />
          </div>

          <input
            placeholder="id (optional, numeric)"
            value={id}
            onChange={onText(setId)}
          />
          <input
            placeholder="name (required)"
            value={name}
            onChange={onText(setName)}
            required
          />
          <input
            placeholder="email (optional, unique)"
            value={email}
            onChange={onText(setEmail)}
          />
          <input
            placeholder="phone"
            value={phone}
            onChange={onText(setPhone)}
          />
          <input placeholder="city" value={city} onChange={onText(setCity)} />
          <input
            placeholder="timezone"
            value={timezone}
            onChange={onText(setTimezone)}
          />
          <input
            placeholder="notes"
            value={notes}
            onChange={onText(setNotes)}
          />

          <button type="submit">Save provider</button>
        </form>
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{out}</pre>
      </section>

      {/* RIGHT: table */}
      <section>
        <h2>Providers</h2>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            maxHeight: 460,
            overflow: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>ID</th>
                <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Name</th>
                <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Email</th>
                <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Phone</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => pick(p)}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{p.id}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{p.name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{p.email ?? ""}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{p.phone ?? ""}</td>
                </tr>
              ))}
              {providers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 12, color: "#666" }}>
                    No providers yet. Click “Load Providers”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
