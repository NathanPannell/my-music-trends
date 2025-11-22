import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { format, isBefore, isAfter, isSameDay, startOfDay } from 'date-fns';
import { TrackDefinition, DailySnapshot, TimelineResponse, TrackSnapshotItem } from '@/lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Fetch history and track details
    const historyResult = await query(`
      SELECT 
        h.track_spotify_id, 
        h.rank, 
        h.start_date, 
        h.end_date,
        t.track_name,
        t.artist_name,
        t.album_art_uri
      FROM playlist_tracks_history h
      JOIN tracks t ON h.track_spotify_id = t.track_spotify_id
      WHERE h.playlist_spotify_id = @playlistId
      ORDER BY h.start_date
    `, { playlistId: id });

    const history = historyResult.recordset;

    // 2. Build Track Definitions
    const trackDefinitions: Record<string, TrackDefinition> = {};
    history.forEach((row: any) => {
      if (!trackDefinitions[row.track_spotify_id]) {
        trackDefinitions[row.track_spotify_id] = {
          id: row.track_spotify_id,
          name: row.track_name,
          artist: row.artist_name,
          albumArt: row.album_art_uri,
        };
      }
    });

    // 3. Generate Sparse Snapshots
    // Helper to get UTC date string (YYYY-MM-DD)
    const toUTCDateString = (date: Date | string) => {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    // Collect all unique dates where a change happened (start_date or end_date)
    const eventDates = new Set<string>();
    history.forEach((row: any) => {
      eventDates.add(toUTCDateString(row.start_date));
      if (row.end_date) {
        eventDates.add(toUTCDateString(row.end_date));
      }
    });

    // Add today to ensure we have the current state
    eventDates.add(toUTCDateString(new Date()));

    const sortedDates = Array.from(eventDates).sort();
    const snapshots: DailySnapshot[] = [];

    // Helper to check if a track was present on a specific date
    const isTrackPresent = (row: any, dateStr: string) => {
      const start = toUTCDateString(row.start_date);
      const end = row.end_date ? toUTCDateString(row.end_date) : null;
      
      // Present if start <= dateStr AND (end is null OR end > dateStr)
      // Note: If end == dateStr, it means it was removed ON that day, so it is NOT present in the snapshot for that day (assuming snapshot represents end-of-day state or "is currently in playlist")
      // Actually, usually "end_date" means the day it was removed. So it's not there anymore.
      return start <= dateStr && (!end || end > dateStr);
    };

    // Helper to check if a track was added on a specific date
    const isTrackAdded = (row: any, dateStr: string) => {
      const start = toUTCDateString(row.start_date);
      return start === dateStr;
    };

    let prevRankMap: Record<string, number> = {};

    for (const dateStr of sortedDates) {
      // First get the tracks and sort them
      const dailyRows = history
        .filter((row: any) => isTrackPresent(row, dateStr))
        .sort((a: any, b: any) => a.rank - b.rank);

      const dailyTracks: TrackSnapshotItem[] = dailyRows.map((row: any) => {
        const currentRank = row.rank;
        const prevRank = prevRankMap[row.track_spotify_id];
        const isNew = prevRank === undefined;
        const rankChange = isNew ? 0 : prevRank - currentRank;

        return {
          id: row.track_spotify_id,
          rank: currentRank,
          added: isTrackAdded(row, dateStr),
          removed: false,
          rankChange,
          isNew
        };
      });

      snapshots.push({
        date: dateStr,
        tracks: dailyTracks
      });

      // Update prevRankMap for next iteration
      prevRankMap = {};
      dailyTracks.forEach(t => {
        prevRankMap[t.id] = t.rank;
      });
    }

    // 4. Calculate Stats
    const uniqueTracks = Object.keys(trackDefinitions).length;
    
    // Calculate total days covered
    const firstDate = snapshots.length > 0 ? new Date(snapshots[0].date) : new Date();
    const lastDate = snapshots.length > 0 ? new Date(snapshots[snapshots.length - 1].date) : new Date();
    const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate stats: presence days, average rank, unique #1s, and streaks
    const trackStats: Record<string, { days: number; totalRank: number; maxStreak: number }> = {};
    const currentStreakMap: Record<string, number> = {};
    const numberOneTracks = new Set<string>();

    snapshots.forEach((snapshot, index) => {
      // For sparse snapshots, we need to weight them by the duration until the next snapshot
      const nextSnapshotDate = index < snapshots.length - 1 
        ? new Date(snapshots[index + 1].date) 
        : new Date(); // or just count as 1 day if it's the last one
      
      const currentSnapshotDate = new Date(snapshot.date);
      const durationDays = Math.max(1, Math.ceil((nextSnapshotDate.getTime() - currentSnapshotDate.getTime()) / (1000 * 60 * 60 * 24)));

      const presentTrackIds = new Set<string>();

      snapshot.tracks.forEach(t => {
        presentTrackIds.add(t.id);

        if (!trackStats[t.id]) {
          trackStats[t.id] = { days: 0, totalRank: 0, maxStreak: 0 };
        }
        trackStats[t.id].days += durationDays;
        trackStats[t.id].totalRank += (t.rank * durationDays);

        if (t.rank === 1) {
          numberOneTracks.add(t.id);
        }

        // Update current streak
        currentStreakMap[t.id] = (currentStreakMap[t.id] || 0) + durationDays;
      });

      // Check for tracks that broke their streak (not present in this snapshot)
      Object.keys(currentStreakMap).forEach(trackId => {
        if (!presentTrackIds.has(trackId)) {
           // Streak broken
           if (trackStats[trackId]) {
             trackStats[trackId].maxStreak = Math.max(trackStats[trackId].maxStreak, currentStreakMap[trackId]);
           }
           currentStreakMap[trackId] = 0;
        }
      });
    });

    // Finalize streaks
    Object.keys(currentStreakMap).forEach(trackId => {
      if (trackStats[trackId]) {
        trackStats[trackId].maxStreak = Math.max(trackStats[trackId].maxStreak, currentStreakMap[trackId]);
      }
    });

    const uniqueNumberOneTracks = numberOneTracks.size;

    const allTrackStats = Object.entries(trackStats).map(([trackId, stats]) => ({
      trackId,
      days: stats.days,
      streak: stats.maxStreak,
      averageRank: stats.totalRank / stats.days,
      // For one-and-done, we need the rank. Since days=1, totalRank is the rank.
      rank: stats.days === 1 ? stats.totalRank : 0 
    }));

    const longestStreakTracks = [...allTrackStats]
      .sort((a, b) => {
        if (b.streak !== a.streak) {
          return b.streak - a.streak; // Primary: Longest streak (desc)
        }
        return a.averageRank - b.averageRank; // Secondary: Average rank (asc)
      })
      .slice(0, 5);

    const oneAndDoneTracks = allTrackStats
      .filter(t => t.days === 1)
      .sort((a, b) => a.rank - b.rank) // Best rank first (lowest number)
      .slice(0, 5);

    const bestAverageRankTracks = [...allTrackStats]
      .filter(t => t.days >= 3) // Filter out tracks with very few days to avoid noise
      .sort((a, b) => a.averageRank - b.averageRank)
      .slice(0, 5);

    const response: TimelineResponse = {
      playlistId: id,
      stats: {
        uniqueTracks,
        totalDays,
        uniqueNumberOneTracks,
        longestStreakTracks,
        oneAndDoneTracks,
        bestAverageRankTracks
      },
      trackDefinitions,
      snapshots
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating timeline:', error);
    return NextResponse.json({ error: 'Failed to generate timeline' }, { status: 500 });
  }
}
