'use client';

import { Dashboard } from '@/components/Dashboard';
import { useParams } from 'next/navigation';

export default function PlaylistPage() {
  const params = useParams();
  const id = params.id as string;

  return <Dashboard initialPlaylistId={id} hideDropdown={true} />;
}
