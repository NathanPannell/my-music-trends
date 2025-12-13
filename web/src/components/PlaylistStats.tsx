import { PlaylistStats as StatsType, TrackDefinition } from '@/lib/mockData';
import { Music, Calendar, Trophy, Crown, ExternalLink } from 'lucide-react';
import { StatsList } from './StatsList';

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
        <StatsList 
          icon={<Trophy size={16} className="text-yellow-500" />}
          title="Longest Streak"
          tooltipText="Tracks with the most consecutive days on the chart."
        >
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
        </StatsList>

        {/* Best Average Rank */}
        <StatsList
          icon={<div className="text-green-400 text-xs font-bold">#</div>}
          title="Best Average"
          tooltipText="Tracks with the best average position (minimum 3 days)."
        >
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
        </StatsList>

        {/* One Hit Wonders */}
        <StatsList
          icon={<div className="text-orange-400 text-xs font-bold">1</div>}
          title="One Hit Wonders"
          tooltipText="Tracks that appeared on the chart for only one day."
        >
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
        </StatsList>

        {/* Unique #1s */}
        <StatsList
          icon={<Crown size={16} className="text-purple-400" />}
          title="Unique #1s"
          tooltipText="Tracks that reached the #1 spot."
        >
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
        </StatsList>

      </div>
    </div>
  );
}

