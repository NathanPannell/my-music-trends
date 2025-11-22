import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Music } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SpotifyImage } from '@/lib/spotify';

interface Playlist {
  id: string;
  name: string;
  owner: string;
  images: SpotifyImage[];
}

interface PlaylistSelectorProps {
  playlists: Playlist[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function PlaylistSelector({ playlists, selectedId, onSelect, disabled }: PlaylistSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPlaylist = playlists.find(p => p.id === selectedId);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={twMerge(
          "flex items-center justify-between gap-3 w-full md:min-w-[240px] px-4 py-2.5 rounded-xl border transition-all duration-200",
          "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80",
          "focus:outline-none focus:ring-2 focus:ring-green-500/50",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-green-500/50 ring-2 ring-green-500/20 bg-zinc-800"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center text-green-500 shrink-0">
            <Music size={14} />
          </div>
          <span className="font-medium text-sm text-zinc-200 truncate">
            {selectedPlaylist?.name || 'Select Playlist'}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={twMerge(
            "text-zinc-500 transition-transform duration-200",
            isOpen && "rotate-180 text-green-500"
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-full md:w-[320px] z-50 origin-top-right"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="p-2 space-y-0.5 max-h-[320px] overflow-y-auto custom-scrollbar">
                {playlists.map((playlist) => {
                  const isSelected = playlist.id === selectedId;
                  return (
                    <button
                      key={playlist.id}
                      onClick={() => {
                        onSelect(playlist.id);
                        setIsOpen(false);
                      }}
                      className={twMerge(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group",
                        isSelected 
                          ? "bg-green-500/10 text-green-400" 
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      )}
                    >
                      <div className={twMerge(
                        "w-8 h-8 rounded flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "bg-green-500/20 text-green-500" : "bg-zinc-800 text-zinc-600 group-hover:bg-zinc-700 group-hover:text-zinc-500"
                      )}>
                        {playlist.images.length > 0 ? (
                          <img src={playlist.images[0].url} alt="Playlist" className="w-full h-full object-cover rounded" />
                        ) : (
                          <Music size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {playlist.name || 'Untitled Playlist'}
                        </div>
                        <div className="text-xs opacity-60 truncate">
                          {playlist.owner}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-green-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
