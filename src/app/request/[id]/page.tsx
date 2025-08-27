import { prisma } from "@/lib/prisma";
import CancelRequestButton from "@/components/CancelRequestButton";

type PageProps = { params: { id: string } };

export default async function RequestDetailPage({ params }: PageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return <main style={{ padding: 16 }}>Invalid id.</main>;
  }

  const request = await prisma.jobRequest.findUnique({
    where: { id },
    include: {
      callouts: {
        orderBy: { id: "desc" },
        select: {
          id: true,
          providerId: true,
          startTime: true as any,
          endTime: true as any,
          status: true as any,
        },
      },
    },
  });

  if (!request) return <main style={{ padding: 16 }}>Not found.</main>;

  const anyReq = request as any;

  const fmt = (d: any) => {
    const dt = d instanceof Date ? d : d ? new Date(d) : null;
    return dt && !isNaN(+dt) ? dt.toLocaleString() : "—";
    };

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: 16 }}>
      <h1>Request #{request.id}</h1>

      <p><b>Category:</b> {String(anyReq.category ?? "—")}</p>
      <p><b>Status:</b> {String(anyReq.status ?? "—")}</p>
      <p><b>Location:</b> {String(anyReq.location ?? "—")}</p>
      <p><b>Description:</b> {String(anyReq.description ?? "—")}</p>

      <h2 style={{ marginTop: 24 }}>Callouts</h2>
      {request.callouts.length === 0 ? (
        <p>No callouts yet.</p>
      ) : (
        <ul>
          {request.callouts.map((c) => (
            <li key={c.id}>
              Provider #{c.providerId} — start: {fmt(c.startTime)}
              {c.endTime ? ` → ${fmt(c.endTime)}` : ""}{c.status ? `, status: ${String(c.status)}` : ""}
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 24 }}>
        <CancelRequestButton id={request.id} />
      </div>
    </main>
  );
}
