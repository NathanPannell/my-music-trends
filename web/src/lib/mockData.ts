import { addDays, format, subDays } from 'date-fns';

export interface TrackDefinition {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

export interface TrackSnapshotItem {
  id: string;
  rank: number;
  added: boolean;
  removed: boolean;
}

export interface DailySnapshot {
  date: string;
  tracks: TrackSnapshotItem[];
}

export interface PlaylistStats {
  uniqueTracks: number;
  totalDays: number;
  mostPopularTracks: { trackId: string; days: number }[];
}

export interface TimelineResponse {
  playlistId: string;
  stats: PlaylistStats;
  trackDefinitions: Record<string, TrackDefinition>;
  snapshots: DailySnapshot[];
}

const MOCK_TRACKS: TrackDefinition[] = [
  { id: 't1', name: 'Bohemian Rhapsody', artist: 'Queen', albumArt: 'https://placehold.co/64' },
  { id: 't2', name: 'Hotel California', artist: 'Eagles', albumArt: 'https://placehold.co/64' },
  { id: 't3', name: 'Sweet Child O Mine', artist: 'Guns N Roses', albumArt: 'https://placehold.co/64' },
  { id: 't4', name: 'Smells Like Teen Spirit', artist: 'Nirvana', albumArt: 'https://placehold.co/64' },
  { id: 't5', name: 'Billie Jean', artist: 'Michael Jackson', albumArt: 'https://placehold.co/64' },
  { id: 't6', name: 'Imagine', artist: 'John Lennon', albumArt: 'https://placehold.co/64' },
  { id: 't7', name: 'Like a Rolling Stone', artist: 'Bob Dylan', albumArt: 'https://placehold.co/64' },
  { id: 't8', name: 'Hey Jude', artist: 'The Beatles', albumArt: 'https://placehold.co/64' },
];

export function generateMockTimeline(playlistId: string): TimelineResponse {
  const totalDays = 30;
  const startDate = subDays(new Date(), totalDays);
  const snapshots: DailySnapshot[] = [];
  const trackDefinitions: Record<string, TrackDefinition> = {};
  
  // Populate definitions
  MOCK_TRACKS.forEach(t => trackDefinitions[t.id] = t);

  // Initial state
  let currentTracks = ['t1', 't2', 't3', 't4', 't5'];

  for (let i = 0; i <= totalDays; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    // Simulate changes
    const added: string[] = [];
    const removed: string[] = [];
    
    if (i > 0 && Math.random() > 0.7) {
      // Randomly remove a track
      if (currentTracks.length > 3) {
        const removeIdx = Math.floor(Math.random() * currentTracks.length);
        removed.push(currentTracks[removeIdx]);
        currentTracks.splice(removeIdx, 1);
      }
      
      // Randomly add a track
      if (Math.random() > 0.5) {
        const available = MOCK_TRACKS.filter(t => !currentTracks.includes(t.id));
        if (available.length > 0) {
          const newTrack = available[Math.floor(Math.random() * available.length)];
          currentTracks.push(newTrack.id);
          added.push(newTrack.id);
        }
      }
      
      // Shuffle ranks slightly
      if (Math.random() > 0.5) {
         currentTracks.sort(() => Math.random() - 0.5);
      }
    }

    const snapshotTracks: TrackSnapshotItem[] = currentTracks.map((tid, idx) => ({
      id: tid,
      rank: idx + 1,
      added: added.includes(tid),
      removed: false // Logic for removed is tricky in snapshot view, usually "removed" means it WAS here yesterday but not today. 
                     // But if it's not in the list, we can't show it in the list as "removed".
                     // Typically "removed" visual is shown on the day it was removed, or we show it in a separate "changes" list.
                     // For now, let's just track added. Removed tracks are just gone from the list.
                     // If we want to show them as "just removed", we'd need to include them in the list with a flag?
                     // Let's stick to simple list for now.
    }));

    snapshots.push({
      date: dateStr,
      tracks: snapshotTracks
    });
  }

  return {
    playlistId,
    stats: {
      uniqueTracks: MOCK_TRACKS.length,
      totalDays,
      mostPopularTracks: MOCK_TRACKS.slice(0, 3).map(t => ({ trackId: t.id, days: 20 })) // Mock stats
    },
    trackDefinitions,
    snapshots
  };
}
