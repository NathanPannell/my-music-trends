import { PlaylistStats as StatsType, TrackDefinition } from '@/lib/mockData';
import { Music, Calendar, Trophy, Crown, ExternalLink } from 'lucide-react';

interface PlaylistStatsProps {
  stats: StatsType;
  definitions: Record<string, TrackDefinition>;
  onTrackClick?: (trackId: string) => void;
}

export function PlaylistStats({ stats, definitions, onTrackClick }: PlaylistStatsProps) {
  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* Summary Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Music size={16} className="text-blue-400" />
            <span className="text-sm font-bold text-white">{stats.uniqueTracks}</span>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Tracks</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-green-400" />
            <span className="text-sm font-bold text-white">{stats.totalDays}</span>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Days</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
        
        {/* Longest Streak */}
        <div className="flex flex-col h-[400px]">
          <div className="p-4 pb-2 flex items-center gap-2 group relative cursor-help shrink-0">
            <Trophy size={16} className="text-yellow-500" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Longest Streak</h3>
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Tracks with the most consecutive days on the chart.
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 space-y-3">
            {stats.longestStreakTracks?.map((item, i) => {
              const def = definitions[item.trackId];
              if (!def) return null;
              return (
                <div 
                  key={item.trackId} 
                  onClick={() => onTrackClick?.(item.trackId)}
                  className="flex items-center gap-3 group/item cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                >
                  <div className="text-xs font-mono text-zinc-600 w-4">{i + 1}</div>
                  <img src={def.albumArt} alt="" className="w-8 h-8 rounded bg-zinc-800 object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate group-hover/item:text-green-400 transition-colors">{def.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{def.artist}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">{item.streak}d</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Average Rank */}
        <div className="flex flex-col h-[400px]">
          <div className="p-4 pb-2 flex items-center gap-2 group relative cursor-help shrink-0">
            <div className="text-green-400 text-xs font-bold">#</div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Best Average</h3>
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Tracks with the best average position (minimum 3 days).
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 space-y-3">
            {stats.bestAverageRankTracks?.map((item, i) => {
              const def = definitions[item.trackId];
              if (!def) return null;
              return (
                <div 
                  key={item.trackId} 
                  onClick={() => onTrackClick?.(item.trackId)}
                  className="flex items-center gap-3 group/item cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                >
                  <div className="text-xs font-mono text-zinc-600 w-4">{i + 1}</div>
                  <img src={def.albumArt} alt="" className="w-8 h-8 rounded bg-zinc-800 object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate group-hover/item:text-green-400 transition-colors">{def.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{def.artist}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-green-400">#{item.averageRank.toFixed(1)}</div>
                    <div className="text-[10px] text-zinc-500">{item.days}d</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* One Hit Wonders */}
        <div className="flex flex-col h-[400px]">
          <div className="p-4 pb-2 flex items-center gap-2 group relative cursor-help shrink-0">
            <div className="text-orange-400 text-xs font-bold">1</div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">One Hit Wonders</h3>
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Tracks that appeared on the chart for only one day.
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 space-y-3">
            {stats.oneAndDoneTracks?.length > 0 ? (
              stats.oneAndDoneTracks.map((item, i) => {
                const def = definitions[item.trackId];
                if (!def) return null;
                return (
                  <div 
                    key={item.trackId} 
                    onClick={() => onTrackClick?.(item.trackId)}
                    className="flex items-center gap-3 group/item cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                  >
                    <div className="text-xs font-mono text-zinc-600 w-4">{i + 1}</div>
                    <img src={def.albumArt} alt="" className="w-8 h-8 rounded bg-zinc-800 object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate group-hover/item:text-green-400 transition-colors">{def.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{def.artist}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-orange-400">#{item.rank}</div>
                      <div className="text-[10px] text-zinc-500">1d</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-zinc-500">No one-hit wonders found.</div>
            )}
          </div>
        </div>

        {/* Unique #1s */}
        <div className="flex flex-col h-[400px]">
          <div className="p-4 pb-2 flex items-center gap-2 group relative cursor-help shrink-0">
            <Crown size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Unique #1s</h3>
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Tracks that reached the #1 spot.
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 space-y-3">
            {stats.uniqueNumberOneTracks?.length > 0 ? (
              stats.uniqueNumberOneTracks.map((item, i) => {
                const def = definitions[item.trackId];
                if (!def) return null;
                return (
                  <div 
                    key={item.trackId} 
                    onClick={() => onTrackClick?.(item.trackId)}
                    className="flex items-center gap-3 group/item cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                  >
                    <div className="text-xs font-mono text-zinc-600 w-4">{i + 1}</div>
                    <img src={def.albumArt} alt="" className="w-8 h-8 rounded bg-zinc-800 object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate group-hover/item:text-green-400 transition-colors">{def.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{def.artist}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-purple-400">{item.daysAtNo1}d</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-zinc-500">No #1 tracks yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
