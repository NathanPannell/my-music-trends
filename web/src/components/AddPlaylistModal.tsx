import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Check, Loader2, ArrowRight, Info } from 'lucide-react';
import { previewPlaylist, addPlaylist } from '@/app/actions';

interface AddPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: string;
}

export function AddPlaylistModal({ isOpen, onClose, initialValue = '' }: AddPlaylistModalProps) {
  const router = useRouter();
  const [playlistId, setPlaylistId] = useState(initialValue);
  const [status, setStatus] = useState<'idle' | 'loading' | 'preview' | 'fallback' | 'spotify-generated' | 'adding' | 'success' | 'exists'>('idle');
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialValue) {
      setPlaylistId(initialValue);
    }
  }, [isOpen, initialValue]);

  // Custom metadata for spotify-generated playlists
  const [customName, setCustomName] = useState('');
  const [customOwnerName, setCustomOwnerName] = useState('');
  const [customOwnerLink, setCustomOwnerLink] = useState('');

  const extractId = (input: string) => {
    // Handle full URLs
    if (input.includes('spotify.com/playlist/')) {
      const parts = input.split('playlist/');
      if (parts[1]) {
        return parts[1].split('?')[0]; // Remove query params
      }
    }
    if (input.includes('spotify.com/user/')) {
      const parts = input.split('user/');
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
    } else if (result.type === 'spotify-generated') {
      setStatus('spotify-generated');
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
        setCustomName('');
        setCustomOwnerName('');
        setCustomOwnerLink('');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [playlistId]);

  const handleAdd = async () => {
    const id = extractId(playlistId);
    setStatus('adding');
    
    const isFallback = status === 'fallback' || status === 'spotify-generated';
    const customMetadata = status === 'spotify-generated' ? {
      name: customName,
      ownerId: extractId(customOwnerLink) // Extract ID from link if provided
    } : undefined;

    const result = await addPlaylist(id, isFallback, customMetadata);
    
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
          setCustomName('');
          setCustomOwnerName('');
          setCustomOwnerLink('');
        }, 300);
      }, 1500);
    } else {
      setError(result.message || 'Failed to add playlist');
      // Revert to previous status
      if (customMetadata) {
        setStatus('spotify-generated');
      } else if (isFallback) {
        setStatus('fallback');
      } else {
        setStatus('preview');
      }
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
        className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-zinc-900 z-10">
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
                  <Info size={16} className="shrink-0" />
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
                    disabled={status !== 'idle' && status !== 'loading' && status !== 'preview' && status !== 'fallback' && status !== 'exists' && status !== 'spotify-generated'}
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
                        src={previewData.images?.[0]?.url || '/api/placeholder'} 
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

                {status === 'spotify-generated' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                      <div className="flex gap-3">
                        <AlertCircle className="text-yellow-500 shrink-0" size={24} />
                        <div className="space-y-2">
                          <h3 className="font-bold text-yellow-500">Limited Data Available</h3>
                          <p className="text-sm text-zinc-300">
                            We confirmed this playlist exists, but it appears to be <strong>Spotify-generated</strong> (e.g., "On Repeat", "Discover Weekly").
                          </p>
                          <p className="text-sm text-zinc-300">
                            We can track it, but we can't automatically fetch the name or owner. Please provide them below.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Playlist Name</label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g. My On Repeat"
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-zinc-400">Spotify User Link or ID (Optional)</label>
                          <div className="relative group">
                            <Info 
                              size={14} 
                              className="text-zinc-500 hover:text-zinc-300 cursor-help transition-colors" 
                            />
                            {/* Mobile-friendly tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-800 border border-white/10 rounded-xl shadow-xl text-xs text-zinc-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                              <p className="font-bold text-white mb-1">How to find your ID:</p>
                              <ol className="list-decimal list-inside space-y-1">
                                <li>Open Spotify Mobile App</li>
                                <li>Click on profile icon</li>
                                <li>Tap <strong>View Profile</strong></li>
                                <li>Tap <strong>...</strong> (three dots)</li>
                                <li>Tap <strong>Share</strong> &gt; <strong>Copy Link</strong></li>
                              </ol>
                              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-800 border-r border-b border-white/10 rotate-45"></div>
                            </div>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={customOwnerLink}
                          onChange={(e) => setCustomOwnerLink(e.target.value)}
                          placeholder="https://open.spotify.com/user/..."
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                        />
                        <p className="text-xs text-zinc-500">
                          We'll use this to fetch your display name and photo.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {status === 'fallback' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 rounded-xl p-4 border border-red-500/20"
                  >
                    <div className="flex gap-3">
                      <AlertCircle className="text-red-500 shrink-0" size={24} />
                      <div className="space-y-2">
                        <h3 className="font-bold text-red-500">Unable to Verify</h3>
                        <p className="text-sm text-zinc-300">
                          We couldn't verify this playlist. It might be private or the URL/ID is incorrect.
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
        {(status === 'preview' || status === 'fallback' || status === 'spotify-generated' || status === 'adding' || status === 'exists') && (
          <div className="p-6 border-t border-white/5 flex gap-3 justify-end bg-black/20 sticky bottom-0">
            <button
              onClick={() => {
                setStatus('idle');
                setPlaylistId('');
                setPreviewData(null);
                setCustomName('');
                setCustomOwnerName('');
                setCustomOwnerLink('');
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
                disabled={status === 'adding' || (status === 'spotify-generated' && !customName)}
                className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
