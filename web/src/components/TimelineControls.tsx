import { Play, Pause, Settings } from 'lucide-react';
import { DailySnapshot } from '@/lib/mockData';
import { useMemo, useRef, useState, useEffect } from 'react';

interface TimelineControlsProps {
  currentDateIndex: number;
  snapshots: DailySnapshot[];
  isPlaying: boolean;
  playbackSpeed: number;
  onPlayPause: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (speed: number) => void;
}

export function TimelineControls({
  currentDateIndex,
  snapshots,
  isPlaying,
  playbackSpeed,
  onPlayPause,
  onSeek,
  onSpeedChange
}: TimelineControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSpeedControl, setShowSpeedControl] = useState(false);

  // Calculate positions for each snapshot
  const positions = useMemo(() => {
    if (snapshots.length < 2) return [0];
    
    const firstTime = new Date(snapshots[0].date).getTime();
    const lastTime = new Date(snapshots[snapshots.length - 1].date).getTime();
    const totalDuration = lastTime - firstTime;

    if (totalDuration === 0) return [0];

    return snapshots.map(s => {
      const time = new Date(s.date).getTime();
      return ((time - firstTime) / totalDuration) * 100;
    });
  }, [snapshots]);

  const handleInteraction = (clientX: number) => {
    if (!containerRef.current || snapshots.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;

    // Find nearest snapshot
    let nearestIndex = 0;
    let minDiff = Number.MAX_VALUE;

    positions.forEach((pos, index) => {
      const diff = Math.abs(pos - percentage);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIndex = index;
      }
    });

    onSeek(nearestIndex);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteraction(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleInteraction(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleInteraction(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleInteraction(e.touches[0].clientX);
      }
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, positions]); // Re-bind if positions change (unlikely during drag but safe)

  const currentSnapshot = snapshots[currentDateIndex];
  const dateLabel = currentSnapshot ? currentSnapshot.date : '';
  const currentPosition = positions[currentDateIndex] || 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 p-4 pb-6 z-50">
      <div className="max-w-4xl mx-auto flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayPause}
            className="p-3 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors shrink-0"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowSpeedControl(!showSpeedControl)}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Playback Speed"
            >
              <Settings size={18} />
            </button>
            
            {showSpeedControl && (
              <div className="absolute bottom-full left-0 mb-2 bg-zinc-800 rounded-lg p-3 shadow-xl border border-zinc-700 w-48">
                <div className="text-xs text-zinc-400 mb-2 font-medium">Speed: {playbackSpeed}ms</div>
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={100}
                  value={playbackSpeed}
                  onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between text-xs font-medium text-zinc-400">
             <span>{dateLabel}</span>
             <span>{currentDateIndex + 1} / {snapshots.length} Changes</span>
          </div>
          
          {/* Custom Slider Container */}
          <div 
            ref={containerRef}
            className="relative h-6 flex items-center cursor-pointer group"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Track Background */}
            <div className="absolute left-0 right-0 h-1 bg-zinc-700 rounded-full overflow-hidden">
               {/* Progress Bar */}
               <div 
                 className="h-full bg-zinc-500" 
                 style={{ width: `${currentPosition}%` }}
               />
            </div>

            {/* Notches */}
            {positions.map((pos, idx) => (
              <div
                key={idx}
                className={`absolute w-0.5 h-1.5 rounded-full transition-colors ${
                  idx === currentDateIndex ? 'bg-white h-2.5' : 'bg-zinc-600 group-hover:bg-zinc-500'
                }`}
                style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
              />
            ))}

            {/* Thumb */}
            <div 
              className="absolute w-3 h-3 bg-white rounded-full shadow-lg transform -translate-x-1/2 transition-transform hover:scale-125"
              style={{ left: `${currentPosition}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
