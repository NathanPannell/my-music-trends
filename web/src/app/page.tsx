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
      }, 100);
    }
  };

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
      <div className="max-w-5xl mx-auto">
        {/* Compact Immersive Header */}
        <div className="relative rounded-2xl overflow-hidden mb-8 border border-white/10">
          {/* Blurred Background Layer */}
          <div className="absolute inset-0 z-0">
            <img 
              src={displayImage} 
              alt="" 
              className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90" />
          </div>

          <div className="relative z-10 p-6 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Cover Image - Smaller */}
              <div className="shrink-0 shadow-2xl rounded-lg overflow-hidden">
                <img 
                  src={displayImage} 
                  alt={displayName} 
                  className="w-32 h-32 object-cover"
                />
              </div>

              {/* Info & Stats Container */}
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-[10px] font-bold tracking-widest text-white/60 uppercase mb-1">Playlist</h2>
                      <h1 className="text-2xl md:text-4xl font-black text-white mb-2 tracking-tight leading-tight">
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
                    <div>
                      <PlaylistSelector
                        playlists={playlists}
                        selectedId={selectedPlaylistId}
                        onSelect={setSelectedPlaylistId}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs font-medium mt-1">
                    {/* Owner */}
                    <a 
                      href={metadata?.owner.id ? `https://open.spotify.com/user/${metadata.owner.id}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full border border-white/5 hover:bg-white/20 transition-colors group"
                    >
                      {metadata?.userProfile?.images?.[0]?.url ? (
                        <img 
                          src={metadata.userProfile.images[0].url} 
                          alt={metadata.owner.display_name} 
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-zinc-700" />
                      )}
                      <span className="text-white group-hover:text-green-400 transition-colors">
                        {metadata?.owner.display_name || 'Unknown User'}
                      </span>
                    </a>
                  </div>
                </div>
                
                {/* Integrated Stats */}
                {!loading && data && (
                   <PlaylistStats 
                     stats={data.stats} 
                     definitions={data.trackDefinitions} 
                     onTrackClick={handleTrackClick}
                   />
                )}
              </div>
            </div>
          </div>
        </div>

        {loading || !data ? (
          <div className="flex items-center justify-center h-64 text-zinc-500">
            {loading ? 'Loading timeline data...' : 'Select a playlist to view history'}
          </div>
        ) : (
          <>
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
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onSeek={(idx) => {
                setCurrentDateIndex(idx);
                setIsPlaying(false);
              }}
              onSpeedChange={setPlaybackSpeed}
            />
          </>
        )}
      </div>
    </div>
  );
}
