import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
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
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '300px',
            height: '300px',
          }}
        >
          {/* Waveform bars - Scaled up */}
          <div style={{ width: '45px', height: '120px', background: '#1DB954', borderRadius: '15px' }} />
          <div style={{ width: '45px', height: '240px', background: '#1DB954', borderRadius: '15px' }} />
          <div style={{ width: '45px', height: '180px', background: '#1DB954', borderRadius: '15px' }} />
          <div style={{ width: '45px', height: '300px', background: '#1DB954', borderRadius: '15px' }} />
          <div style={{ width: '45px', height: '150px', background: '#1DB954', borderRadius: '15px' }} />
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  )
}
