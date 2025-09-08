export default function RequestDetailPage({ params }) {
  const id = Number(params?.id);
  return (
    <main>
      <h1>Request #{Number.isFinite(id) ? id : "Invalid"}</h1>
    </main>
  );
}
