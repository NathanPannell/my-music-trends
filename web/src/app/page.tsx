'use client';

import { useEffect, useState, useRef } from 'react';
import { TimelineResponse } from '@/lib/mockData';
import { PlaylistStats } from '@/components/PlaylistStats';
import { TimelineControls } from '@/components/TimelineControls';
import { DayView } from '@/components/DayView';
import { PlaylistSelector } from '@/components/PlaylistSelector';

interface Playlist {
  id: string;
  name: string;
  owner: string;
}

import { PlaylistMetadata } from '@/lib/spotify';

export default function DashboardPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [metadata, setMetadata] = useState<PlaylistMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch playlists on mount
  useEffect(() => {
    fetch('/api/playlists')
      .then(res => res.json())
      .then((data: Playlist[]) => {
        setPlaylists(data);
        if (data.length > 0) {
          setSelectedPlaylistId(data[0].id);
        }
      })
      .catch(err => console.error('Failed to fetch playlists:', err));
  }, []);

  // Fetch timeline and metadata when selected playlist changes
  useEffect(() => {
    if (!selectedPlaylistId) return;

    setLoading(true);
    setData(null);
    setMetadata(null);
    setCurrentDateIndex(0);
    setIsPlaying(false);

    Promise.all([
      fetch(`/api/playlists/${selectedPlaylistId}/timeline`).then(res => res.json()),
      fetch(`/api/playlists/${selectedPlaylistId}/metadata`).then(res => res.json())
    ])
      .then(([timelineData, metadataData]) => {
        setData(timelineData);
        setMetadata(metadataData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch data:', err);
        setLoading(false);
      });
  }, [selectedPlaylistId]);

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

  if (!selectedPlaylistId && playlists.length === 0) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading playlists...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {metadata?.images?.[0]?.url ? (
              <img 
                src={metadata.images[0].url} 
                alt={metadata.name} 
                className="w-32 h-32 rounded-lg shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg shadow-lg bg-zinc-800 flex items-center justify-center text-zinc-600">
                <svg className="w-12 h-12 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                {metadata ? metadata.name : 'Playlist History'}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {metadata?.userProfile?.images?.[0]?.url && (
                  <img 
                    src={metadata.userProfile.images[0].url} 
                    alt={metadata.owner.display_name} 
                    className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                  />
                )}
                <p className="text-zinc-400">
                  {metadata ? `By ${metadata.owner.display_name}` : 'Visualizing the evolution of your playlist over time.'}
                </p>
              </div>
              {metadata?.description && (
                <p className="text-zinc-500 text-sm mt-1 max-w-md truncate">
                  {metadata.description}
                </p>
              )}
            </div>
          </div>
          
          <PlaylistSelector
            playlists={playlists}
            selectedId={selectedPlaylistId}
            onSelect={setSelectedPlaylistId}
            disabled={loading}
          />
        </header>

        {loading || !data ? (
          <div className="flex items-center justify-center h-64 text-zinc-500">
            {loading ? 'Loading timeline data...' : 'Select a playlist to view history'}
          </div>
        ) : (
          <>
            <PlaylistStats stats={data.stats} definitions={data.trackDefinitions} />

            <DayView 
              tracks={data.snapshots[currentDateIndex].tracks} 
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
              dateLabel={data.snapshots[currentDateIndex].date}
            />
          </>
        )}
      </div>
    </div>
  );
}
