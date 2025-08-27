export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <nav style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <a href="/">Home</a>
          <a href="/auth/register">Register</a>
          <a href="/auth/login">Login</a>
          <a href="/request/new">New Request</a>
          <a href="/admin/providers-upsert">Admin: provider upsert</a>
          <a href="/admin/callouts">Admin: Schedule Call-out</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
