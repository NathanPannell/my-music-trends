import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Playlist Timeline'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Waveform Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div style={{ width: '20px', height: '60px', background: '#1DB954', borderRadius: '10px' }} />
          <div style={{ width: '20px', height: '120px', background: '#1DB954', borderRadius: '10px' }} />
          <div style={{ width: '20px', height: '90px', background: '#1DB954', borderRadius: '10px' }} />
          <div style={{ width: '20px', height: '150px', background: '#1DB954', borderRadius: '10px' }} />
          <div style={{ width: '20px', height: '80px', background: '#1DB954', borderRadius: '10px' }} />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.05em',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Playlist Timeline
        </div>
        
        <div
          style={{
            fontSize: 30,
            color: '#888',
            marginTop: '20px',
            letterSpacing: '-0.02em',
          }}
        >
          Visualize your music history
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
