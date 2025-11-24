import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Check, Loader2, ArrowRight } from 'lucide-react';
import { previewPlaylist, addPlaylist } from '@/app/actions';

interface AddPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPlaylistModal({ isOpen, onClose }: AddPlaylistModalProps) {
  const router = useRouter();
  const [playlistId, setPlaylistId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'preview' | 'fallback' | 'adding' | 'success' | 'exists'>('idle');
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const extractId = (input: string) => {
    // Handle full URLs
    if (input.includes('spotify.com/playlist/')) {
      const parts = input.split('playlist/');
      if (parts[1]) {
        return parts[1].split('?')[0]; // Remove query params
      }
    }
    return input;
  };

  const handlePreview = async () => {
    const id = extractId(playlistId);
    if (!id) {
      // Don't show error for empty input during auto-search
      return;
    }

    setStatus('loading');
    setError(null);

    const result = await previewPlaylist(id);

    if (result.type === 'error') {
      setError(result.message);
      setStatus('idle');
    } else if (result.type === 'exists') {
      setStatus('exists');
    } else if (result.type === 'success') {
      setPreviewData(result.data);
      setStatus('preview');
    } else {
      setStatus('fallback');
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (playlistId.trim()) {
        handlePreview();
      } else {
        setStatus('idle');
        setPreviewData(null);
        setError(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [playlistId]);

  const handleAdd = async () => {
    const id = extractId(playlistId);
    setStatus('adding');
    
    const result = await addPlaylist(id, status === 'fallback');
    
    if (result.success) {
      setStatus('success');
      setTimeout(() => {
        onClose();
        router.push(`/playlist/${id}`);
        // Reset state after closing
        setTimeout(() => {
          setPlaylistId('');
          setStatus('idle');
          setPreviewData(null);
        }, 300);
      }, 1500);
    } else {
      setError(result.message || 'Failed to add playlist');
      setStatus(status === 'fallback' ? 'fallback' : 'preview');
    }
  };

  const handleGoToPlaylist = () => {
    const id = extractId(playlistId);
    onClose();
    router.push(`/playlist/${id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">Add Playlist</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 text-green-400">
              <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mb-4">
                <Check size={32} />
              </div>
              <p className="text-lg font-medium">Playlist Added Successfully!</p>
              <p className="text-sm text-zinc-400 mt-2">Redirecting...</p>
            </div>
          ) : (
            <>
              {/* Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-400/10 p-3 rounded-lg border border-blue-400/20 mb-4">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>Please ensure the playlist is <strong>public</strong> before adding.</span>
                </div>

                <label className="text-sm font-medium text-zinc-400">
                  Playlist Link or ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={playlistId}
                    onChange={(e) => setPlaylistId(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
                    disabled={status !== 'idle' && status !== 'loading' && status !== 'preview' && status !== 'fallback' && status !== 'exists'}
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm flex items-center gap-2 mt-2">
                    <AlertCircle size={14} />
                    {error}
                  </p>
                )}
              </div>

              {/* Preview State */}
              <AnimatePresence mode="wait">
                {status === 'loading' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-center py-8"
                  >
                    <Loader2 className="animate-spin text-green-500" size={32} />
                  </motion.div>
                )}

                {status === 'exists' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20"
                  >
                    <div className="flex gap-3">
                      <Check className="text-blue-500 shrink-0" size={24} />
                      <div className="space-y-2">
                        <h3 className="font-bold text-blue-500">Playlist Already Tracked</h3>
                        <p className="text-sm text-zinc-300">
                          This playlist is already in our database. You can view its history right now.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {status === 'preview' && previewData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex gap-4">
                      <img 
                        src={previewData.images?.[0]?.url || '/spotify-logo.png'} 
                        alt={previewData.name}
                        className="w-24 h-24 rounded-lg object-cover shadow-lg" 
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate">{previewData.name}</h3>
                        <p className="text-zinc-400 text-sm truncate">By {previewData.owner.display_name}</p>
                        <p className="text-zinc-500 text-xs mt-2 line-clamp-2">{previewData.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {status === 'fallback' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20"
                  >
                    <div className="flex gap-3">
                      <AlertCircle className="text-yellow-500 shrink-0" size={24} />
                      <div className="space-y-2">
                        <h3 className="font-bold text-yellow-500">Limited Tracking Available</h3>
                        <p className="text-sm text-zinc-300">
                          We couldn't fetch full details for this playlist. This usually happens with:
                        </p>
                        <ul className="text-sm text-zinc-400 list-disc list-inside ml-2">
                          <li>Spotify-generated playlists (e.g., "On Repeat")</li>
                          <li>Private playlists</li>
                          <li>Playlists with missing metadata</li>
                        </ul>
                        <p className="text-sm text-zinc-300 mt-2">
                          We can still track it, but <strong>only the top 30 songs</strong> will be recorded.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Footer */}
        {(status === 'preview' || status === 'fallback' || status === 'adding' || status === 'exists') && (
          <div className="p-6 border-t border-white/5 flex gap-3 justify-end bg-black/20">
            <button
              onClick={() => {
                setStatus('idle');
                setPlaylistId('');
                setPreviewData(null);
              }}
              disabled={status === 'adding'}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            {status === 'exists' ? (
              <button
                onClick={handleGoToPlaylist}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full transition-colors flex items-center gap-2"
              >
                Go to Playlist
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleAdd}
                disabled={status === 'adding'}
                className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {status === 'adding' && <Loader2 className="animate-spin" size={16} />}
                Confirm & Add
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
