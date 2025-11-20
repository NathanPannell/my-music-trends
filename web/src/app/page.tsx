'use client';

import { useEffect, useState, useRef } from 'react';
import { TimelineResponse } from '@/lib/mockData';
import { PlaylistStats } from '@/components/PlaylistStats';
import { TimelineControls } from '@/components/TimelineControls';
import { DayView } from '@/components/DayView';

export default function DashboardPage() {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch mock data for a playlist
    fetch('/api/playlists/p1/timeline')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentDateIndex(prev => {
          if (!data) return prev;
          if (prev >= data.snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500); // 500ms per day
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, data]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading timeline...
      </div>
    );
  }

  const currentSnapshot = data.snapshots[currentDateIndex];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Playlist History
          </h1>
          <p className="text-zinc-400 mt-2">
            Visualizing the evolution of your playlist over time.
          </p>
        </header>

        <PlaylistStats stats={data.stats} />

        <DayView 
          tracks={currentSnapshot.tracks} 
          definitions={data.trackDefinitions} 
        />

        <TimelineControls
          currentDateIndex={currentDateIndex}
          totalDays={data.snapshots.length}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onSeek={(idx) => {
            setCurrentDateIndex(idx);
            setIsPlaying(false);
          }}
          dateLabel={currentSnapshot.date}
        />
      </div>
    </div>
  );
}
