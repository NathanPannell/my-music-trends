import { TrackDefinition, TrackSnapshotItem } from '@/lib/mockData';
import { Minus, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';

interface DayViewProps {
  tracks: TrackSnapshotItem[];
  definitions: Record<string, TrackDefinition>;
  highlightedTrackId?: string | null;
}

export function DayView({ tracks, definitions, highlightedTrackId }: DayViewProps) {
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 30;
  
  // Auto-expand if highlighted track is hidden
  useEffect(() => {
    if (highlightedTrackId && !showAll) {
      const trackIndex = tracks.findIndex(t => t.id === highlightedTrackId);
      if (trackIndex >= LIMIT) {
        setShowAll(true);
      }
    }
  }, [highlightedTrackId, tracks, showAll]);

  const displayedTracks = showAll ? tracks : tracks.slice(0, LIMIT);
  const hasMore = tracks.length > LIMIT;

  return (
    <div className="space-y-2 pb-32">
      <AnimatePresence mode='popLayout'>
        {displayedTracks.map((track) => {
          const def = definitions[track.id];
          if (!def) return null;
          
          const isTop3 = track.rank <= 3;
          const isRank1 = track.rank === 1;
          const isRank2 = track.rank === 2;
          const isRank3 = track.rank === 3;
          const isHighlighted = track.id === highlightedTrackId;

          return (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20, scale: 1 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: isHighlighted ? 1.02 : 1,
                zIndex: isHighlighted ? 20 : 0
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={track.id}
              id={`track-${track.id}`}
              className={twMerge(
                "flex items-center gap-4 p-3 rounded-lg border transition-colors duration-300 relative overflow-hidden",
                track.added 
                  ? 'bg-green-900/20 border-green-500/50' 
                  : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50',
                isRank1 && "bg-yellow-500/10 border-yellow-500/50",
                isRank2 && "bg-zinc-400/10 border-zinc-400/50",
                isRank3 && "bg-orange-700/10 border-orange-700/50",
                isHighlighted && "bg-green-500/20 border-green-500 ring-1 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
              )}
            >
              {/* Rank Indicator */}
              <div className={twMerge(
                "w-8 text-center font-mono font-bold flex flex-col items-center justify-center z-10",
                isRank1 ? "text-yellow-500 text-xl" :
                isRank2 ? "text-zinc-300 text-lg" :
                isRank3 ? "text-orange-400 text-lg" :
                "text-zinc-500",
                isHighlighted && "text-green-400"
              )}>
                <span>{track.rank}</span>
                {track.rankChange !== 0 && !track.isNew && (
                  <span className={twMerge(
                    "text-[10px] flex items-center",
                    track.rankChange > 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {track.rankChange > 0 ? '▲' : '▼'} {Math.abs(track.rankChange)}
                  </span>
                )}
              </div>
              
              {/* Album Art & Track Info Linked */}
              <a 
                href={`https://open.spotify.com/track/${track.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 flex-1 min-w-0 z-10 group"
              >
                {/* Album Art */}
                <div className={twMerge(
                  "relative rounded overflow-hidden bg-zinc-800 flex-shrink-0 transition-transform duration-300 group-hover:scale-105",
                  isTop3 ? "w-16 h-16 shadow-lg" : "w-12 h-12",
                  isHighlighted && "ring-2 ring-green-500/50"
                )}>
                  <Image 
                    src={def.albumArt} 
                    alt={def.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                
                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h4 className={twMerge(
                    "font-medium text-white truncate group-hover:text-green-400 transition-colors",
                    isTop3 && "text-lg",
                    isHighlighted && "text-green-400 font-bold"
                  )}>{def.name}</h4>
                  <p className={twMerge(
                    "text-sm text-zinc-400 truncate group-hover:text-zinc-300 transition-colors",
                    isHighlighted && "text-green-500/70"
                  )}>{def.artist}</p>
                </div>
              </a>

              {/* Status Indicator */}
              <div className="w-12 flex justify-center z-10">
                {track.isNew ? (
                  <div className="bg-green-900 text-green-400 px-2 py-0.5 rounded text-xs font-bold animate-pulse border border-green-700">
                    NEW
                  </div>
                ) : track.rankChange > 0 ? (
                  <div className="text-green-500 text-xs font-bold">
                    +{track.rankChange}
                  </div>
                ) : track.rankChange < 0 ? (
                  <div className="text-red-500 text-xs font-bold">
                    {track.rankChange}
                  </div>
                ) : (
                  <Minus size={16} className={twMerge("text-zinc-700", isHighlighted && "text-green-500/50")} />
                )}
              </div>

              {/* Background Glow for Top 3 */}
              {isRank1 && <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent pointer-events-none" />}
              {isRank2 && <div className="absolute inset-0 bg-gradient-to-r from-zinc-400/5 to-transparent pointer-events-none" />}
              {isRank3 && <div className="absolute inset-0 bg-gradient-to-r from-orange-700/5 to-transparent pointer-events-none" />}
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-4 flex items-center justify-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-lg transition-colors border border-dashed border-zinc-800"
        >
          {showAll ? (
            <>
              <ChevronUp size={20} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={20} />
              Show {tracks.length - LIMIT} More Tracks
            </>
          )}
        </button>
      )}

      {tracks.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          No tracks in playlist for this day.
        </div>
      )}
    </div>
  );
}
