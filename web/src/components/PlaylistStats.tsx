import { PlaylistStats as StatsType, TrackDefinition } from '@/lib/mockData';
import { Music, Calendar, Trophy, Crown, ExternalLink } from 'lucide-react';

interface PlaylistStatsProps {
  stats: StatsType;
  definitions: Record<string, TrackDefinition>;
  onTrackClick?: (trackId: string) => void;
}

export function PlaylistStats({ stats, definitions, onTrackClick }: PlaylistStatsProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Unique Tracks */}
        <div className="bg-black/20 backdrop-blur-md p-3 rounded-lg border border-white/5 flex items-center gap-3 group relative cursor-help">
          <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
            <Music size={16} />
          </div>
          <div>
            <h3 className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider">Tracks</h3>
            <p className="text-xl font-bold text-white leading-none">{stats.uniqueTracks}</p>
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Total number of unique tracks that have appeared on this playlist.
          </div>
        </div>

        {/* Total Days */}
        <div className="bg-black/20 backdrop-blur-md p-3 rounded-lg border border-white/5 flex items-center gap-3 group relative cursor-help">
          <div className="p-2 rounded-full bg-green-500/10 text-green-400">
            <Calendar size={16} />
          </div>
          <div>
            <h3 className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider">Days</h3>
            <p className="text-xl font-bold text-white leading-none">{stats.totalDays}</p>
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Total number of days tracked in this timeline.
          </div>
        </div>

        {/* Unique #1s */}
        <div className="bg-black/20 backdrop-blur-md p-3 rounded-lg border border-white/5 flex items-center gap-3 group relative cursor-help">
          <div className="p-2 rounded-full bg-purple-500/10 text-purple-400">
            <Crown size={16} />
          </div>
          <div>
            <h3 className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider">Unique #1s</h3>
            <p className="text-xl font-bold text-white leading-none">{stats.uniqueNumberOneTracks}</p>
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Number of different tracks that have reached the #1 spot.
          </div>
        </div>
      </div>

      {/* Detailed Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Longest Streak */}
        <div className="bg-black/20 backdrop-blur-md rounded-lg border border-white/5 overflow-hidden">
          <div className="p-3 border-b border-white/5 bg-white/5 flex items-center gap-2 group relative cursor-help">
            <Trophy size={14} className="text-yellow-500" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Longest Streak</h3>
            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Tracks with the most consecutive days on the chart. Click a track to jump to its peak.
            </div>
          </div>
          <div className="p-2 space-y-2">
            {stats.longestStreakTracks?.slice(0, 3).map((item, i) => {
              const def = definitions[item.trackId];
              if (!def) return null;
              return (
                <div 
                  key={item.trackId} 
                  className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors group/item cursor-pointer relative"
                  onClick={() => onTrackClick?.(item.trackId)}
                >
                  <div className="text-xs font-mono text-zinc-500 w-4">{i + 1}</div>
                  <img src={def.albumArt} alt="" className="w-8 h-8 rounded bg-zinc-800 object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate group-hover/item:text-green-400 transition-colors">{def.name}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{def.artist}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">{item.streak}d</div>
                    <div className="text-[10px] text-zinc-500">Avg #{item.averageRank.toFixed(1)}</div>
                  </div>
                  
                  {/* External Link Icon */}
                  <a
                    href={`https://open.spotify.com/track/${item.trackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all z-10"
                    onClick={(e) => e.stopPropagation()}
                    title="Open in Spotify"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Average Rank */}
        <div className="bg-black/20 backdrop-blur-md rounded-lg border border-white/5 overflow-hidden">
          <div className="p-3 border-b border-white/5 bg-white/5 flex items-center gap-2 group relative cursor-help">
            <div className="text-green-400 text-xs font-bold">#</div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Best Average Rank</h3>
            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Tracks with the best average position (minimum 3 days). Click a track to jump to its peak.
            </div>
          </div>
          <div className="p-2 space-y-2">
            {stats.bestAverageRankTracks?.slice(0, 3).map((item, i) => {
              const def = definitions[item.trackId];
              if (!def) return null;
              return (
                <div 
                  key={item.trackId} 
                  className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors group/item cursor-pointer relative"
                  onClick={() => onTrackClick?.(item.trackId)}
                >
                  <div className="text-xs font-mono text-zinc-500 w-4">{i + 1}</div>
                  <img src={def.albumArt} alt="" className="w-8 h-8 rounded bg-zinc-800 object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate group-hover/item:text-green-400 transition-colors">{def.name}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{def.artist}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-green-400">#{item.averageRank.toFixed(1)}</div>
                    <div className="text-[10px] text-zinc-500">{item.days}d</div>
                  </div>

                  {/* External Link Icon */}
                  <a
                    href={`https://open.spotify.com/track/${item.trackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all z-10"
                    onClick={(e) => e.stopPropagation()}
                    title="Open in Spotify"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* One Hit Wonders */}
        <div className="bg-black/20 backdrop-blur-md rounded-lg border border-white/5 overflow-hidden">
          <div className="p-3 border-b border-white/5 bg-white/5 flex items-center gap-2 group relative cursor-help">
            <div className="text-orange-400 text-xs font-bold">1</div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">One Hit Wonders</h3>
            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Tracks that appeared on the chart for only one day. Click a track to jump to that day.
            </div>
          </div>
          <div className="p-2 space-y-2">
            {stats.oneAndDoneTracks?.length > 0 ? (
              stats.oneAndDoneTracks.slice(0, 3).map((item, i) => {
                const def = definitions[item.trackId];
                if (!def) return null;
                return (
                  <div 
                    key={item.trackId} 
                    className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors group/item cursor-pointer relative"
                    onClick={() => onTrackClick?.(item.trackId)}
                  >
                    <div className="text-xs font-mono text-zinc-500 w-4">{i + 1}</div>
                    <img src={def.albumArt} alt="" className="w-8 h-8 rounded bg-zinc-800 object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate group-hover/item:text-green-400 transition-colors">{def.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{def.artist}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-orange-400">#{item.rank}</div>
                      <div className="text-[10px] text-zinc-500">Peak</div>
                    </div>

                    {/* External Link Icon */}
                    <a
                      href={`https://open.spotify.com/track/${item.trackId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all z-10"
                      onClick={(e) => e.stopPropagation()}
                      title="Open in Spotify"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-zinc-500">No one-hit wonders found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
