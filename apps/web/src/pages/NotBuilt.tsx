/** Placeholder for each brief's feature. Replace it with the feature you build. */
export function NotBuilt({ brief, runId }: { brief: string; runId?: string }) {
  return (
    <div className="empty">
      <h1>Not built yet</h1>
      <p>
        This page is the feature in <code>briefs/{brief}.md</code>
        {runId ? <> for run <code>{runId}</code></> : null}.
      </p>
    </div>
  );
}
