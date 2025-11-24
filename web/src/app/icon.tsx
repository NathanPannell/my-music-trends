import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%', // Circular icon looks better in tabs usually
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            width: '20px',
            height: '20px',
          }}
        >
          {/* Waveform bars */}
          <div style={{ width: '3px', height: '8px', background: '#1DB954', borderRadius: '1px' }} />
          <div style={{ width: '3px', height: '16px', background: '#1DB954', borderRadius: '1px' }} />
          <div style={{ width: '3px', height: '12px', background: '#1DB954', borderRadius: '1px' }} />
          <div style={{ width: '3px', height: '20px', background: '#1DB954', borderRadius: '1px' }} />
          <div style={{ width: '3px', height: '10px', background: '#1DB954', borderRadius: '1px' }} />
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
