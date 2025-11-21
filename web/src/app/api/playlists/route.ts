import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query('SELECT playlist_spotify_id, playlist_name, playlist_owner_spotify_id FROM playlists');
    
    const playlists = result.recordset.map((row: any) => ({
      id: row.playlist_spotify_id,
      name: row.playlist_name,
      owner: row.playlist_owner_spotify_id,
    }));

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}
