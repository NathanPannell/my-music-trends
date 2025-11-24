'use server';

import { getPool } from '@/lib/db';
import { getPlaylistMetadata } from '@/lib/spotify';
import { revalidatePath } from 'next/cache';

export type PreviewResult = 
  | { type: 'success'; data: any }
  | { type: 'fallback'; id: string }
  | { type: 'exists'; message: string }
  | { type: 'error'; message: string };

export async function previewPlaylist(playlistId: string): Promise<PreviewResult> {
  try {
    // 1. Check limit
    const pool = await getPool();
    const countResult = await pool.request().query('SELECT COUNT(*) as count FROM playlists');
    const count = countResult.recordset[0].count;

    if (count >= 200) {
      return { type: 'error', message: 'Maximum limit of 200 playlists reached.' };
    }

    // 2. Check if already exists
    const existsResult = await pool.request()
      .input('id', playlistId)
      .query('SELECT 1 FROM playlists WHERE playlist_spotify_id = @id');
    
    if (existsResult.recordset.length > 0) {
      return { type: 'exists', message: 'This playlist is already being tracked.' };
    }

    // 3. Fetch metadata
    try {
      const metadata = await getPlaylistMetadata(playlistId);
      return { type: 'success', data: metadata };
    } catch (err) {
      console.log('Metadata fetch failed, falling back:', err);
      return { type: 'fallback', id: playlistId };
    }

  } catch (err) {
    console.error('Preview error:', err);
    return { type: 'error', message: 'An unexpected error occurred.' };
  }
}

export async function addPlaylist(playlistId: string, isFallback: boolean) {
  try {
    const pool = await getPool();
    
    if (isFallback) {
      await pool.request()
        .input('id', playlistId)
        .input('isOrdered', 1)
        .input('isGenerated', 1)
        .query(`
          INSERT INTO playlists (
            playlist_spotify_id, 
            is_ordered, 
            is_spotify_generated,
            playlist_name,
            playlist_owner_spotify_id
          ) VALUES (
            @id, 
            @isOrdered, 
            @isGenerated,
            'Unknown Playlist',
            'spotify'
          )
        `);
    } else {
      // Fetch metadata one last time to be sure
      const metadata = await getPlaylistMetadata(playlistId);
      
      await pool.request()
        .input('id', playlistId)
        .input('name', metadata.name)
        .input('ownerId', metadata.owner.id)
        .input('ownerName', metadata.owner.display_name)
        .input('art', metadata.images?.[0]?.url || null)
        .input('isOrdered', 0)
        .input('isGenerated', 0)
        .query(`
          INSERT INTO playlists (
            playlist_spotify_id, 
            playlist_name,
            playlist_owner_spotify_id,
            playlist_owner_display_name,
            playlist_art_uri,
            is_ordered, 
            is_spotify_generated
          ) VALUES (
            @id, 
            @name,
            @ownerId,
            @ownerName,
            @art,
            @isOrdered, 
            @isGenerated
          )
        `);
    }

    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Add playlist error:', err);
    return { success: false, message: 'Failed to add playlist to database.' };
  }
}
