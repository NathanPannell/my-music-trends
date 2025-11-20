import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    { id: 'p1', name: 'My Top Songs', owner: 'User' },
    { id: 'p2', name: 'Discover Weekly', owner: 'Spotify' },
  ]);
}
