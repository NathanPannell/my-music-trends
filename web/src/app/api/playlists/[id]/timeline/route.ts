import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { addDays, format, subDays, isBefore, isAfter, isSameDay, startOfDay } from 'date-fns';
import { TrackDefinition, DailySnapshot, PlaylistStats, TimelineResponse, TrackSnapshotItem } from '@/lib/mockData';

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

    // 3. Generate Daily Snapshots
    const totalDays = 30;
    const today = startOfDay(new Date());
    const startDate = subDays(today, totalDays);
    const snapshots: DailySnapshot[] = [];

    // Helper to check if a track was present on a specific date
    const isTrackPresent = (row: any, date: Date) => {
      const start = startOfDay(new Date(row.start_date));
      const end = row.end_date ? startOfDay(new Date(row.end_date)) : null;
      
      // Present if start <= date AND (end is null OR end > date)
      // Note: end_date is when it was removed, so it's NOT present on end_date
      return (isBefore(start, date) || isSameDay(start, date)) && 
             (!end || isAfter(end, date));
    };

    // Helper to check if a track was added on a specific date
    const isTrackAdded = (row: any, date: Date) => {
      const start = startOfDay(new Date(row.start_date));
      return isSameDay(start, date);
    };

    let prevRankMap: Record<string, number> = {};

    for (let i = 0; i <= totalDays; i++) {
      const currentDate = addDays(startDate, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      // First get the tracks and sort them
      const dailyRows = history
        .filter((row: any) => isTrackPresent(row, currentDate))
        .sort((a: any, b: any) => a.rank - b.rank);

      const dailyTracks: TrackSnapshotItem[] = dailyRows.map((row: any) => {
        const currentRank = row.rank;
        const prevRank = prevRankMap[row.track_spotify_id];
        const isNew = prevRank === undefined;
        const rankChange = isNew ? 0 : prevRank - currentRank;

        return {
          id: row.track_spotify_id,
          rank: currentRank,
          added: isTrackAdded(row, currentDate),
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
    
    // Calculate most popular tracks (days present in the window)
    const trackPresenceCounts: Record<string, number> = {};
    snapshots.forEach(snapshot => {
      snapshot.tracks.forEach(t => {
        trackPresenceCounts[t.id] = (trackPresenceCounts[t.id] || 0) + 1;
      });
    });

    const mostPopularTracks = Object.entries(trackPresenceCounts)
      .map(([trackId, days]) => ({ trackId, days }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

    const response: TimelineResponse = {
      playlistId: id,
      stats: {
        uniqueTracks,
        totalDays,
        mostPopularTracks
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
