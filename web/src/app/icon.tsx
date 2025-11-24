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
          fontSize: 20,
          background: 'linear-gradient(to bottom right, #1a1a1a, #000)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFD700', // Gold
          borderRadius: '8px',
          border: '1px solid #333',
        }}
      >
        🎺
      </div>
    ),
    {
      ...size,
    }
  )
}
