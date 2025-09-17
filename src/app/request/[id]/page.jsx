import { prisma } from "@/lib/prisma";
import CancelButton from "./CancelButton";

export default async function RequestDetailPage({ params }) {
  const id = params?.id;
  const rid = Number(id);

  if (!Number.isFinite(rid)) {
    return <div className="p-6">Invalid request id.</div>;
  }

  let request = null;
  try {
    request = await prisma.jobRequest.findUnique({
      where: { id: rid },
      include: { callouts: true },
    });
  } catch (e) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Server error</h1>
        <p className="text-sm text-gray-600">{String(e?.message ?? e)}</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Request not found</h1>
        <p className="text-sm text-gray-600">ID: {rid}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Request #{request.id}</h1>
        <p className="text-gray-600 text-sm">
          {request.category} · {request.location} ·{" "}
          {new Date(request.createdAt).toLocaleString()}
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-medium">What needs quoting</h2>
        <p className="rounded-md border px-3 py-2">{request.description}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Callouts</h2>
        {request.callouts.length === 0 ? (
          <p className="text-gray-600 text-sm">No callouts yet.</p>
        ) : (
          <ul className="space-y-2">
            {request.callouts.map((c) => (
              <li key={c.id} className="rounded-md border px-3 py-2">
                <div className="text-sm">
                  <span className="font-medium">Status:</span> {String(c.status)}
                </div>
                {"providerId" in c && c.providerId && (
                  <div className="text-sm">
                    <span className="font-medium">Provider:</span> {c.providerId}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <CancelButton id={request.id} />
    </div>
  );
}
