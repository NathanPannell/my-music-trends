import { Play, Pause } from 'lucide-react';

interface TimelineControlsProps {
  currentDateIndex: number;
  totalDays: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (index: number) => void;
  dateLabel: string;
}

export function TimelineControls({
  currentDateIndex,
  totalDays,
  isPlaying,
  onPlayPause,
  onSeek,
  dateLabel
}: TimelineControlsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 p-6 pb-8 z-50">
      <div className="max-w-4xl mx-auto flex items-center gap-6">
        <button
          onClick={onPlayPause}
          className="p-3 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors"
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>
        
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between text-sm font-medium text-zinc-400">
             <span>{dateLabel}</span>
             <span>Day {currentDateIndex + 1} of {totalDays}</span>
          </div>
          <input
            type="range"
            min={0}
            max={totalDays - 1}
            value={currentDateIndex}
            onChange={(e) => onSeek(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>
    </div>
  );
}
