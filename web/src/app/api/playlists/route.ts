import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query('SELECT playlist_spotify_id, playlist_name, playlist_owner_display_name, playlist_art_uri FROM playlists');
    
    const playlists = result.recordset.map((row: any) => ({
      id: row.playlist_spotify_id,
      name: row.playlist_name,
      owner: row.playlist_owner_display_name,
      images: row.playlist_art_uri ? [{ url: row.playlist_art_uri, height: 300, width: 300 }] : [],
    }));

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}
