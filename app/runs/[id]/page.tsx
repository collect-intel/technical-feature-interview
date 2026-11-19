"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "../../_components/api.ts";

type Verdict = { criterion_id: string; judge_id: string; verdict: "met" | "unmet" | null; raw: string | null };
type Cell = { id: string; target_id: string; item_id: string; status: string; attempts: number; error_class: string | null; response: string | null; verdicts: Verdict[] };
type Run = { id: string; status: string; cells: { status: string; n: number }[]; calls: { kind: string; status: string; n: number; cost_usd: number }[] };

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const run = useApi<Run>(`/api/runs/${id}`, 1500);
  const cells = useApi<Cell[]>(`/api/runs/${id}/cells`, 1500);
  if (run.error) return <p className="error">{run.error}</p>;
  if (!run.data || !cells.data) return <p className="muted">Loading…</p>;
  const cost = run.data.calls.reduce((a, c) => a + (c.cost_usd ?? 0), 0);
  const retries = run.data.calls.filter((c) => c.status !== "ok").reduce((a, c) => a + c.n, 0);
  return (
    <>
      <h1>
        {run.data.id} <span className={`status ${run.data.status}`}>{run.data.status}</span>
      </h1>
      <p className="tabs">
        <Link href={`/runs/${id}/panel`}>Panel</Link>
        <Link href={`/runs/${id}/diversity`}>Diversity</Link>
      </p>
      <p className="muted">
        Cells: {run.data.cells.map((c) => `${c.n} ${c.status}`).join(" · ")} · failed attempts retried: {retries} · cost ${cost.toFixed(4)}
      </p>
      <table>
        <thead>
          <tr><th>Item</th><th>Target</th><th>Status</th><th>Response</th><th>Verdicts</th></tr>
        </thead>
        <tbody>
          {cells.data.map((c) => (
            <tr key={c.id}>
              <td>{c.item_id}</td>
              <td>{c.target_id}</td>
              <td><span className={`status ${c.status}`}>{c.status}</span>{c.error_class ? ` (${c.error_class})` : ""}</td>
              <td className="response">{c.response ?? "—"}</td>
              <td className="verdicts">
                {c.verdicts.map((v) => (
                  <span key={v.criterion_id + v.judge_id} title={`${v.criterion_id} · ${v.judge_id}${v.raw ? ` · ${v.raw}` : ""}`} className={`v ${v.verdict ?? "missing"}`}>
                    {v.verdict === "met" ? "✓" : v.verdict === "unmet" ? "✗" : "?"}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
