import { PlaylistStats as StatsType, TrackDefinition } from '@/lib/mockData';

export function PlaylistStats({ stats, definitions }: { stats: StatsType; definitions: Record<string, TrackDefinition> }) {
  const topTrackId = stats.mostPopularTracks[0]?.trackId;
  const topTrackDef = topTrackId ? definitions[topTrackId] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h3 className="text-zinc-400 text-sm font-medium">Unique Tracks</h3>
        <p className="text-3xl font-bold text-white mt-2">{stats.uniqueTracks}</p>
      </div>
      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h3 className="text-zinc-400 text-sm font-medium">Total Days Tracked</h3>
        <p className="text-3xl font-bold text-white mt-2">{stats.totalDays}</p>
      </div>
      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h3 className="text-zinc-400 text-sm font-medium">Top Track</h3>
        {topTrackDef ? (
          <div className="mt-2">
             <p className="text-xl font-bold text-white truncate">{topTrackDef.name}</p>
             <p className="text-zinc-400 text-sm truncate">{topTrackDef.artist}</p>
          </div>
        ) : (
          <p className="text-xl font-bold text-white mt-2">N/A</p>
        )}
        <p className="text-zinc-500 text-xs mt-1">
          {stats.mostPopularTracks[0]?.days || 0} days on chart
        </p>
      </div>
    </div>
  );
}
