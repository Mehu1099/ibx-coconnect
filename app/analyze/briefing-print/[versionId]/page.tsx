import BriefingPrintClient from "./BriefingPrintClient";

export default async function BriefingPrintPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;
  return <BriefingPrintClient versionId={versionId} />;
}
