"use client";
import { useApi } from "./api.ts";

export function ScenarioTitle() {
  const scenario = useApi<{ title: string }>("/api/scenario").data;
  return <span className="scenario">{scenario ? scenario.title : "…"}</span>;
}
