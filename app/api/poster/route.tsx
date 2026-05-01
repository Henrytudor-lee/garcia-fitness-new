import { ImageResponse } from '@vercel/og';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataParam = searchParams.get('data');
    if (!dataParam) return new NextResponse('Missing data', { status: 400 });

    let stats: any;
    try {
      stats = JSON.parse(atob(dataParam));
    } catch {
      return new NextResponse('Invalid data', { status: 400 });
    }

    const CARD_W = 1200;
    const CARD_H = 630;

    const jsx = (
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          background: '#1a1a2e',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#CCF200', fontSize: 72, fontWeight: 900 }}>GFIT</span>
          <span style={{ color: 'white', fontSize: 36, marginTop: 20 }}>Workout Complete</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 24, marginTop: 10 }}>
            {stats.exerciseCount || 0} Exercises
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 24 }}>
            {stats.totalVolume || 0} kg Volume
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20, marginTop: 8 }}>
            {stats.date || ''}
          </span>
        </div>
      </div>
    );

    return new ImageResponse(jsx, {
      width: CARD_W,
      height: CARD_H,
    });
  } catch (e: any) {
    console.error('Poster error:', e);
    return new NextResponse(`Error: ${e.message}`, { status: 500 });
  }
}
