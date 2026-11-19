"use client";
import { useEffect, useState } from "react";

/** Fetch JSON from the API; `refreshMs` polls while the component is mounted. */
export function useApi<T>(path: string | null, refreshMs = 0): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let alive = true;
    const load = () =>
      fetch(path)
        .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json()).error ?? r.statusText))))
        .then((d) => alive && (setData(d), setError(null)))
        .catch((e) => alive && setError(e.message));
    load();
    const t = refreshMs ? setInterval(load, refreshMs) : null;
    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
  }, [path, refreshMs]);
  return { data, error };
}
