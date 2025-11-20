import { TrackDefinition, TrackSnapshotItem } from '@/lib/mockData';
import { Minus } from 'lucide-react';
import Image from 'next/image';

interface DayViewProps {
  tracks: TrackSnapshotItem[];
  definitions: Record<string, TrackDefinition>;
}

export function DayView({ tracks, definitions }: DayViewProps) {
  return (
    <div className="space-y-2 pb-32">
      {tracks.map((track) => {
        const def = definitions[track.id];
        if (!def) return null;
        
        return (
          <div 
            key={track.id}
            className={`
              flex items-center gap-4 p-3 rounded-lg border transition-all duration-500
              ${track.added 
                ? 'bg-green-900/20 border-green-500/50' 
                : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50'}
            `}
          >
            <div className="w-8 text-center font-mono text-zinc-500 font-bold">
              {track.rank}
            </div>
            
            <div className="relative w-12 h-12 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
              <Image 
                src={def.albumArt} 
                alt={def.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white truncate">{def.name}</h4>
              <p className="text-sm text-zinc-400 truncate">{def.artist}</p>
            </div>

            <div className="w-8 flex justify-center">
              {track.added ? (
                <div className="text-green-500 animate-bounce">
                  <span className="text-xs font-bold">NEW</span>
                </div>
              ) : (
                <Minus size={16} className="text-zinc-700" />
              )}
            </div>
          </div>
        );
      })}
      
      {tracks.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          No tracks in playlist for this day.
        </div>
      )}
    </div>
  );
}
