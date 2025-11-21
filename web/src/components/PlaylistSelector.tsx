import React from 'react';

interface Playlist {
  id: string;
  name: string;
  owner: string;
}

interface PlaylistSelectorProps {
  playlists: Playlist[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function PlaylistSelector({ playlists, selectedId, onSelect, disabled }: PlaylistSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <label htmlFor="playlist-select" className="text-zinc-400 text-sm font-medium">
        Select Playlist:
      </label>
      <div className="relative">
        <select
          id="playlist-select"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled}
          className="appearance-none bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
        >
          {playlists.map((playlist) => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.name || 'Untitled Playlist'}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
