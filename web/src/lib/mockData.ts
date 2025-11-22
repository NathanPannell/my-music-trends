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
  rankChange: number; // Positive = moved up (improved), Negative = moved down
  isNew: boolean;
}

export interface DailySnapshot {
  date: string;
  tracks: TrackSnapshotItem[];
}

export interface PlaylistStats {
  uniqueTracks: number;
  totalDays: number;
  uniqueNumberOneTracks: number;
  longestStreakTracks: { trackId: string; days: number; streak: number; averageRank: number }[];
  oneAndDoneTracks: { trackId: string; days: number; rank: number }[];
  bestAverageRankTracks: { trackId: string; averageRank: number; days: number }[];
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
  let previousRankMap: Record<string, number> = {};
  
  // Initialize previous ranks
  currentTracks.forEach((id, idx) => previousRankMap[id] = idx + 1);

  for (let i = 0; i <= totalDays; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    // Simulate changes
    const added: string[] = [];
    
    if (i > 0 && Math.random() > 0.7) {
      // Randomly remove a track
      if (currentTracks.length > 3) {
        const removeIdx = Math.floor(Math.random() * currentTracks.length);
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

    const snapshotTracks: TrackSnapshotItem[] = currentTracks.map((tid, idx) => {
      const currentRank = idx + 1;
      const prevRank = previousRankMap[tid];
      
      // Calculate change
      // If it wasn't there yesterday, it's new (no rank change to show, or show as new)
      // If it was there, change = prev - current (e.g. prev 5, current 2 => +3 improvement)
      let rankChange = 0;
      let isNew = false;

      if (prevRank === undefined) {
        isNew = true;
      } else {
        rankChange = prevRank - currentRank;
      }

      return {
        id: tid,
        rank: currentRank,
        added: added.includes(tid), // "added" in this specific step simulation
        removed: false,
        rankChange,
        isNew
      };
    });

    snapshots.push({
      date: dateStr,
      tracks: snapshotTracks
    });

    // Update previous rank map for next iteration
    previousRankMap = {};
    currentTracks.forEach((id, idx) => previousRankMap[id] = idx + 1);
  }

  return {
    playlistId,
    stats: {
      uniqueTracks: MOCK_TRACKS.length,
      totalDays,
      uniqueNumberOneTracks: 5,
      longestStreakTracks: MOCK_TRACKS.slice(0, 3).map(t => ({ trackId: t.id, days: 20, streak: 15, averageRank: 5 })),
      oneAndDoneTracks: MOCK_TRACKS.slice(3, 4).map(t => ({ trackId: t.id, days: 1, rank: 10 })),
      bestAverageRankTracks: MOCK_TRACKS.slice(0, 3).map(t => ({ trackId: t.id, averageRank: 2.5, days: 15 }))
    },
    trackDefinitions,
    snapshots
  };
}
