import { NotBuilt } from "../../../_components/NotBuilt.tsx";

export default async function DiversityPage({ params }: { params: Promise<{ id: string }> }) {
  return <NotBuilt brief="model-monoculture" runId={(await params).id} />;
}
