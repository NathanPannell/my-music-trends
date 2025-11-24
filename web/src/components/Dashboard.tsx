'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TimelineResponse } from '@/lib/mockData';
import { PlaylistStats } from '@/components/PlaylistStats';
import { TimelineControls } from '@/components/TimelineControls';
import { DayView } from '@/components/DayView';
import { PlaylistSelector } from '@/components/PlaylistSelector';
import { ParticleBackground } from '@/components/ParticleBackground';
import { ChevronDown, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaylistMetadata, SpotifyImage } from '@/lib/spotify';
import { fetchWithRetry } from '@/lib/api';

interface Playlist {
  id: string;
  name: string;
  owner: string;
  images: SpotifyImage[];
}

interface DashboardProps {
  initialPlaylistId?: string;
  hideDropdown?: boolean;
}

export function Dashboard({ initialPlaylistId, hideDropdown }: DashboardProps) {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(initialPlaylistId || '');
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [metadata, setMetadata] = useState<PlaylistMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // Default 1000ms (slow)
  const [highlightedTrackId, setHighlightedTrackId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch playlists on mount
  useEffect(() => {
    fetchWithRetry('/api/playlists')
      .then((data: Playlist[]) => {
        setPlaylists(data);
        
        if (initialPlaylistId) {
          const exists = data.find(p => p.id === initialPlaylistId);
          if (!exists) {
            // Redirect to home with add param
            router.push(`/?addPlaylist=${initialPlaylistId}`);
            return;
          }
        }

        if (data.length > 0 && !selectedPlaylistId) {
          setSelectedPlaylistId(data[0].id);
        }
      })
      .catch(err => console.error('Failed to fetch playlists:', err));
  }, [initialPlaylistId]); // Add initialPlaylistId dependency

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
      fetchWithRetry(`/api/playlists/${selectedPlaylistId}/timeline`),
      fetchWithRetry(`/api/playlists/${selectedPlaylistId}/metadata`)
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

  const scrollToStats = () => {
    const element = document.getElementById('stats-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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

  // Back to Top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const dayViewHeader = document.getElementById('day-view-header');
      if (dayViewHeader) {
        const rect = dayViewHeader.getBoundingClientRect();
        // Show when the header is above the viewport (scrolled past)
        setShowBackToTop(rect.top < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data]); // Re-bind when data loads (element exists)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!selectedPlaylistId && playlists.length === 0) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        {/* Loading state hidden */}
      </div>
    );
  }

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);
  const displayName = metadata?.name || selectedPlaylist?.name || '';
  const displayImage = metadata?.images?.[0]?.url || '/api/placeholder';


  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="w-full">
        
        {/* Header & Stats Section */}
        <div className="space-y-8">
          {/* Playlist Header (Hero Section) */}
          <div className="relative w-full h-[calc(100vh-6rem)] flex flex-col justify-center items-center overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
              <img 
                src={displayImage} 
                alt="" 
                className="w-full h-full object-cover blur-3xl opacity-50 scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />
              <ParticleBackground />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto p-6 flex flex-col gap-12">
              {/* Top Row: Image, Info, Selector */}
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 justify-center">
                {/* Cover Image */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="shrink-0 shadow-2xl rounded-2xl overflow-hidden"
                >
                  <img 
                    src={displayImage} 
                    alt={displayName} 
                    className="w-48 h-48 md:w-64 md:h-64 object-cover shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                  />
                </motion.div>

                {/* Info */}
                <div className="flex flex-col items-center md:items-start gap-6 text-center md:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h2 className="text-xs font-bold tracking-[0.2em] text-white/60 uppercase mb-2">Playlist Timeline</h2>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-4">
                      <a 
                        href={`https://open.spotify.com/playlist/${selectedPlaylistId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-white hover:to-zinc-400 transition-all duration-300"
                      >
                        {displayName}
                      </a>
                    </h1>
                  </motion.div>

                  {/* Owner Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <a 
                      href={metadata?.owner?.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center md:justify-start gap-4 bg-white/5 backdrop-blur-md p-2 pr-6 rounded-full border border-white/10 hover:bg-white/10 transition-all group/owner"
                    >
                      <img 
                        src={metadata?.owner?.images?.[0]?.url || '/api/placeholder'} 
                        alt={metadata?.owner?.display_name || 'Unknown User'} 
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="text-sm">
                        <span className="text-white/60 mr-1">Curated by</span>
                        <span className="font-bold text-white group-hover/owner:text-green-400 transition-colors">{metadata?.owner?.display_name || 'Unknown User'}</span>
                      </div>
                    </a>
                  </motion.div>

                  {/* Selector */}
                  {!hideDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="w-full md:w-72 mt-2 flex flex-col gap-3"
                    >
                      <PlaylistSelector 
                        playlists={playlists} 
                        selectedId={selectedPlaylistId} 
                        onSelect={setSelectedPlaylistId} 
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Bouncing Arrow */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer z-20"
              onClick={scrollToStats}
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <ChevronDown className="text-white/50 hover:text-white transition-colors w-10 h-10" />
              </motion.div>
            </motion.div>
          </div>

          {/* Stats Integration */}
          {data && (
            <div id="stats-section" className="pt-6 max-w-7xl mx-auto px-4 md:px-8 mb-20">
              <PlaylistStats 
                stats={data.stats} 
                definitions={data.trackDefinitions} 
                onTrackClick={handleTrackClick}
              />
            </div>
          )}
        </div>

        {loading || !data ? (
          <div className="flex items-center justify-center h-64 text-zinc-500">
            {loading ? '' : 'Select a playlist to view history'}
          </div>
        ) : data.stats.uniqueTracks === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 max-w-2xl mx-auto text-center px-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-blue-400 mb-4">Tracking Started!</h3>
              <p className="text-zinc-300 leading-relaxed">
                This playlist has just been added to our system. It typically takes up to <strong>24 hours</strong> for the first batch of data to be recorded and appear here.
              </p>
              <p className="text-zinc-400 mt-4 text-sm">
                Check back tomorrow to see your first timeline update!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-8 pb-32">
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

      {/* Back to Top Arrow */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToStats}
            className="fixed top-8 right-8 z-50 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-colors shadow-lg group"
            title="Back to Top"
          >
            <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
