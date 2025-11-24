'use server';

import { getPool } from '@/lib/db';
import { getPlaylistMetadata, checkSpotifyGeneratedPlaylist, getUserProfile } from '@/lib/spotify';
import { revalidatePath } from 'next/cache';

export type PreviewResult = 
  | { type: 'success'; data: any }
  | { type: 'fallback'; id: string }
  | { type: 'spotify-generated'; id: string }
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
      console.log('Metadata fetch failed, checking if spotify generated:', err);
      
      // Check if it's a valid spotify generated playlist
      const isSpotifyGenerated = await checkSpotifyGeneratedPlaylist(playlistId);
      
      if (isSpotifyGenerated) {
        return { type: 'spotify-generated', id: playlistId };
      }
      
      return { type: 'error', message: 'Could not fetch playlist. It might be private or the URL is incorrect.' };
    }

  } catch (err) {
    console.error('Preview error:', err);
    return { type: 'error', message: 'An unexpected error occurred.' };
  }
}

export async function addPlaylist(
  playlistId: string, 
  isFallback: boolean,
  customMetadata?: {
    name: string;
    ownerId?: string;
  }
) {
  try {
    const pool = await getPool();
    
    if (isFallback) {
      // Use custom metadata if provided (for spotify-generated flow), otherwise defaults
      const name = customMetadata?.name || 'Unknown Playlist';
      let ownerName = 'spotify';
      let ownerId = 'spotify';

      // If ownerId is provided, try to fetch their profile
      if (customMetadata?.ownerId) {
        try {
          const userProfile = await getUserProfile(customMetadata.ownerId);
          ownerName = userProfile.display_name;
          ownerId = userProfile.id;
        } catch (e) {
          console.error('Failed to fetch user profile for custom owner:', e);
          // Fallback to using the ID as name if fetch fails, or just 'spotify'
          ownerName = customMetadata.ownerId;
          ownerId = customMetadata.ownerId;
        }
      }
      
      await pool.request()
        .input('id', playlistId)
        .input('isOrdered', 1)
        .input('isGenerated', 1)
        .input('name', name)
        .input('ownerName', ownerName)
        .input('ownerId', ownerId)
        .query(`
          INSERT INTO playlists (
            playlist_spotify_id, 
            is_ordered, 
            is_spotify_generated,
            playlist_name,
            playlist_owner_display_name,
            playlist_owner_spotify_id
          ) VALUES (
            @id, 
            @isOrdered, 
            @isGenerated,
            @name,
            @ownerName,
            @ownerId
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
