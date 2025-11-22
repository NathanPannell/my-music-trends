import { Dashboard } from '@/components/Dashboard';

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Dashboard initialPlaylistId={id} />;
}
