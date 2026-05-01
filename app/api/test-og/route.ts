import { ImageResponse } from '@vercel/og';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: 1200, height: 630, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: 72, fontWeight: 900 }}>TEST</span>
      </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: any) {
    return new NextResponse(`Error: ${e.message}`, { status: 500 });
  }
}
