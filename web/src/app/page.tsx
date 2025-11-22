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
  images: SpotifyImage[];
}

import { PlaylistMetadata, SpotifyImage } from '@/lib/spotify';

export default function DashboardPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [metadata, setMetadata] = useState<PlaylistMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // Default 1000ms (slow)
  const [highlightedTrackId, setHighlightedTrackId] = useState<string | null>(null);
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
    setHighlightedTrackId(null);

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
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, data, playbackSpeed]);

  const handleTrackClick = (trackId: string) => {
    if (!data) return;

    // Find the first snapshot where this track appears with its best rank
    let bestRank = Infinity;
    let bestDateIndex = -1;

    data.snapshots.forEach((snapshot, index) => {
      const track = snapshot.tracks.find(t => t.id === trackId);
      if (track) {
        if (track.rank < bestRank) {
          bestRank = track.rank;
          bestDateIndex = index;
        }
      }
    });

    if (bestDateIndex !== -1) {
      setIsPlaying(false);
      setCurrentDateIndex(bestDateIndex);
      setHighlightedTrackId(trackId);
      
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedTrackId(null), 3000);
      
      // Wait for render then scroll
      setTimeout(() => {
        const element = document.getElementById(`track-${trackId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 600);
    }
  };

  const scrollToDayView = () => {
    const element = document.getElementById('day-view-header');
    if (element) {
      const offset = 80; // Offset for sticky header/controls if needed, or just breathing room
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!data) return;

      if (e.key === 'ArrowLeft') {
        setCurrentDateIndex(prev => {
          const newIndex = Math.max(0, prev - 1);
          if (newIndex !== prev) scrollToDayView();
          return newIndex;
        });
        setIsPlaying(false);
      } else if (e.key === 'ArrowRight') {
        setCurrentDateIndex(prev => {
          const newIndex = Math.min(data.snapshots.length - 1, prev + 1);
          if (newIndex !== prev) scrollToDayView();
          return newIndex;
        });
        setIsPlaying(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => {
          const next = !prev;
          if (next) scrollToDayView();
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data]);

  if (!selectedPlaylistId && playlists.length === 0) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading playlists...
      </div>
    );
  }

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);
  const displayName = metadata?.name || selectedPlaylist?.name || 'Loading...';
  const displayImage = metadata?.images?.[0]?.url || '/spotify-logo.png';


  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header & Stats Section */}
        <div className="space-y-8">
          {/* Playlist Header */}
          <div className="relative rounded-2xl border border-white/10">
            {/* Blurred Background Layer */}
            <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden">
              <img 
                src={displayImage} 
                alt="" 
                className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90" />
            </div>

            <div className="relative z-10 p-6 flex flex-col gap-8">
              {/* Top Row: Image, Info, Selector */}
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Cover Image */}
                <div className="shrink-0 shadow-2xl rounded-lg overflow-hidden">
                  <img 
                    src={displayImage} 
                    alt={displayName} 
                    className="w-32 h-32 md:w-24 md:h-24 object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 text-center md:text-left min-w-0">
                  <div>
                    <h2 className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-1">Playlist</h2>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none truncate">
                      <a 
                        href={`https://open.spotify.com/playlist/${selectedPlaylistId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline decoration-white/30 underline-offset-4"
                      >
                        {displayName}
                      </a>
                    </h1>
                  </div>

                  {/* Owner Info */}
                  <div className="flex items-center justify-center md:justify-start gap-3 bg-black/20 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white/5 shrink-0">
                    <img 
                      src={metadata?.owner?.images?.[0]?.url || '/spotify-logo.png'} 
                      alt={metadata?.owner?.display_name || 'Spotify'} 
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="text-xs">
                      <span className="text-white/60 mr-1">by</span>
                      <span className="font-bold text-white">{metadata?.owner?.display_name || 'Spotify'}</span>
                    </div>
                  </div>
                </div>

                {/* Selector */}
                <div className="w-full md:w-64 shrink-0">
                  <PlaylistSelector 
                    playlists={playlists} 
                    selectedId={selectedPlaylistId} 
                    onSelect={setSelectedPlaylistId} 
                  />
                </div>
              </div>

              {/* Stats Integration */}
              {data && (
                <div className="pt-6 border-t border-white/10">
                  <PlaylistStats 
                    stats={data.stats} 
                    definitions={data.trackDefinitions} 
                    onTrackClick={handleTrackClick}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {loading || !data ? (
          <div className="flex items-center justify-center h-64 text-zinc-500">
            {loading ? 'Loading timeline data...' : 'Select a playlist to view history'}
          </div>
        ) : (
          <div className="space-y-6">
            <div id="day-view-header" className="flex items-center justify-between border-b border-white/10 pb-4 scroll-mt-24">
              <div>
                <h2 className="text-2xl font-bold text-white">Daily History</h2>
                <p className="text-zinc-400 text-sm">Track rankings over time</p>
              </div>
              <div className="text-zinc-500 text-sm font-mono">
                {new Date(data.snapshots[currentDateIndex].date).toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            <DayView 
              tracks={data.snapshots[currentDateIndex].tracks} 
              definitions={data.trackDefinitions} 
              highlightedTrackId={highlightedTrackId}
            />

            <TimelineControls
              currentDateIndex={currentDateIndex}
              snapshots={data.snapshots}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              onPlayPause={() => {
                const nextState = !isPlaying;
                setIsPlaying(nextState);
                if (nextState) scrollToDayView();
              }}
              onSeek={(idx) => {
                setCurrentDateIndex(idx);
                setIsPlaying(false);
                scrollToDayView();
              }}
              onSpeedChange={setPlaybackSpeed}
            />
          </div>
        )}
      </div>
    </div>

  );
}
