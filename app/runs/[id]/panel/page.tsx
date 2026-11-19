import { NotBuilt } from "../../../_components/NotBuilt.tsx";

export default async function PanelPage({ params }: { params: Promise<{ id: string }> }) {
  return <NotBuilt brief="judge-panel-trust" runId={(await params).id} />;
}
