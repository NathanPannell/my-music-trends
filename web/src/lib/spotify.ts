const CLIENT_ID = process.env.client_id || process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.client_secret || process.env.SPOTIFY_CLIENT_SECRET;

let cachedToken: string | null = null;
let tokenExpiration: number = 0;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiration) {
    return cachedToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing Spotify credentials in environment variables');
  }

  const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Spotify access token: ${error}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Set expiration 60 seconds before actual expiration to be safe
  tokenExpiration = Date.now() + (data.expires_in * 1000) - 60000;

  return cachedToken as string;
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface UserProfile {
  display_name: string;
  id: string;
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

export interface PlaylistMetadata {
  name: string;
  owner: {
    display_name: string;
    id: string;
    images: SpotifyImage[];
    external_urls: {
      spotify: string;
    };
  };
  images: SpotifyImage[];
  description: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const token = await getAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user profile: ${error}`);
  }

  return response.json();
}

export async function getPlaylistMetadata(playlistId: string): Promise<PlaylistMetadata> {
  const token = await getAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?fields=name,owner(display_name,id,external_urls),images,description`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Playlist not found');
    }
    const error = await response.text();
    throw new Error(`Failed to fetch playlist metadata: ${error}`);
  }

  return response.json();
}

export async function checkSpotifyGeneratedPlaylist(playlistId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://open.spotify.com/playlist/${playlistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) return false;
    
    const html = await response.text();
    // Check for music:song meta tags which indicate tracks exist
    const match = html.match(/<meta name="music:song" content="https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)"/);
    
    return !!match;
  } catch (e) {
    console.error('Error checking spotify generated playlist:', e);
    return false;
  }
}
