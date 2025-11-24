'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PlaylistSelector } from '@/components/PlaylistSelector';
import { ParticleBackground } from '@/components/ParticleBackground';
import { SpotifyImage } from '@/lib/spotify';

interface Playlist {
  id: string;
  name: string;
  owner: string;
  images: SpotifyImage[];
}

export function Hero() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/playlists')
      .then(res => res.json())
      .then((data: Playlist[]) => {
        // Filter playlists by owner "Nathan Pannell" for demo
        const filteredPlaylists = data.filter(p => p.owner === 'Nathan Pannell');
        setPlaylists(filteredPlaylists);
        
        // We don't auto-select a playlist ID for navigation, but we can use the first one for the background visual if we want,
        // or just leave it empty until they pick one.
        // Let's default to the first one for the background visual only.
        if (filteredPlaylists.length > 0) {
           // We won't set selectedPlaylistId here so the selector shows "Select Playlist"
           // But we can store it in a separate state if we wanted a default background.
           // For now, let's just use the first one's image if available for the background, 
           // but keep the selector empty.
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch playlists:', err);
        setLoading(false);
      });
  }, []);

  const handleNavigate = () => {
    if (selectedPlaylistId) {
      router.push(`/playlist/${selectedPlaylistId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  // Use the selected playlist for the background, or the first available one as a fallback for visuals
  const activePlaylist = playlists.find(p => p.id === selectedPlaylistId) || playlists[0];
  const displayImage = activePlaylist?.images?.[0]?.url || '/spotify-logo.png';

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src={displayImage} 
          alt="" 
          className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black" />
        <ParticleBackground />
      </div>

      <div className="relative z-10 w-full h-screen flex flex-col justify-center items-center p-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-8">
          
          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter">
              Playlist Timeline
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Visualize the journey of your Spotify playlists. Discover how tracks rise and fall, explore daily rankings, and relive your musical history.
            </p>
          </motion.div>

          {/* Action Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center gap-4 w-full max-w-md mt-8"
          >
            <div className="text-sm font-medium text-green-400 uppercase tracking-widest mb-2">
                Select an example playlist to start
            </div>
            
            <div className="w-full relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative">
                <PlaylistSelector 
                  playlists={playlists} 
                  selectedId={selectedPlaylistId} 
                  onSelect={(id) => {
                    setSelectedPlaylistId(id);
                    router.push(`/playlist/${id}`);
                  }} 
                />
              </div>
            </div>
          </motion.div>

        </div>

        {/* Footer / Credits */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-0 right-0 text-center"
        >
          <a href="https://github.com/nathanpannell/playlist-timeline" className="text-zinc-600 text-sm">
            GitHub
          </a>
        </motion.div>
      </div>
    </div>
  );
}
