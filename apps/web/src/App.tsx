import { useApi } from "./api.ts";
import { Link, useRoute } from "./router.tsx";
import { Runs } from "./pages/Runs.tsx";
import { RunDetail } from "./pages/RunDetail.tsx";
import { NotBuilt } from "./pages/NotBuilt.tsx";

export function App() {
  const route = useRoute();
  const scenario = useApi<{ title: string; round: string }>("/api/scenario").data;
  let page: React.ReactNode;
  if (route[0] === "runs" && route[1] && route[2] === "panel") page = <NotBuilt brief="judge-panel-trust" runId={route[1]} />;
  else if (route[0] === "runs" && route[1] && route[2] === "diversity") page = <NotBuilt brief="model-monoculture" runId={route[1]} />;
  else if (route[0] === "runs" && route[1]) page = <RunDetail id={route[1]} />;
  else if (route[0] === "lab") page = <NotBuilt brief="convention-lab" />;
  else page = <Runs />;
  return (
    <div className="shell">
      <header>
        <Link to="/" className="brand">Mini Studio</Link>
        <nav>
          <Link to="/">Runs</Link>
          <Link to="/lab">Lab</Link>
        </nav>
        <span className="scenario">{scenario ? scenario.title : "…"}</span>
      </header>
      <main>{page}</main>
    </div>
  );
}
