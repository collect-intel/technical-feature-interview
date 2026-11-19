"use client";
import Link from "next/link";
import { useApi } from "./_components/api.ts";

type Run = { id: string; status: string; created_at: string; finished_at: string | null; manifest_hash: string };

export default function RunsPage() {
  const { data, error } = useApi<Run[]>("/api/runs", 2000);
  if (error) return <p className="error">Couldn't load runs: {error}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  if (data.length === 0) return <p className="muted">No runs yet. The first run starts a moment after the server boots.</p>;
  return (
    <>
      <h1>Runs</h1>
      <table>
        <thead>
          <tr><th>Run</th><th>Status</th><th>Started</th><th>Finished</th><th>Manifest</th></tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/runs/${r.id}`}>{r.id}</Link></td>
              <td><span className={`status ${r.status}`}>{r.status}</span></td>
              <td>{new Date(r.created_at).toLocaleTimeString()}</td>
              <td>{r.finished_at ? new Date(r.finished_at).toLocaleTimeString() : "—"}</td>
              <td className="mono">{r.manifest_hash.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
