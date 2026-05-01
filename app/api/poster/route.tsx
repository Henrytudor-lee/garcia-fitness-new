import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface SetData {
  id: number;
  weight: number;
  reps: number;
  weight_unit: string;
  sequence: number;
}

interface GroupData {
  exercise_id: number;
  name: string;
  image_name: string | null;
  sets: SetData[];
}

interface PosterRequest {
  exerciseCount: number;
  totalVolume: number;
  elapsedSeconds: number;
  date: string;
  groups: GroupData[];
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
  return String(vol);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataParam = searchParams.get('data');
    if (!dataParam) return new NextResponse('Missing data', { status: 400 });

    let stats: PosterRequest;
    try {
      stats = JSON.parse(decodeURIComponent(dataParam));
    } catch {
      return new NextResponse('Invalid data', { status: 400 });
    }

    const CARD_W = 1200;
    const CARD_PAD = 48;
    const INNER = CARD_W - CARD_PAD * 2;
    const EXERCISE_CARD_H = 116;
    const FOOTER_H = 60;
    const TOP_H = 320;
    const STAT_ROW_H = 100;
    const EXERCISE_LIST_GAP = 12;
    const CARD_H =
      TOP_H + STAT_ROW_H + 40 +
      stats.groups.length * (EXERCISE_CARD_H + EXERCISE_LIST_GAP) +
      FOOTER_H;

    const exercises = stats.groups.map((group) => {
      const groupVolume = group.sets.reduce(
        (sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0
      );
      const sortedSets = [...group.sets].sort(
        (a, b) => (a.sequence || 0) - (b.sequence || 0)
      );
      return { group, groupVolume, sortedSets };
    });

    const jsx = (
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: `${CARD_PAD}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 9999, background: 'radial-gradient(circle, rgba(204,242,0,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: 40, left: -30, width: 160, height: 160, borderRadius: 9999, background: 'radial-gradient(circle, rgba(139,195,74,0.1) 0%, transparent 70%)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: TOP_H, paddingTop: 40 }}>
          <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: '0.3em', background: 'linear-gradient(135deg, #CCF200, #F2E500)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GFIT
          </span>

          <div style={{ width: 64, height: 64, borderRadius: 9999, background: 'linear-gradient(135deg, #CCF200, #8BC34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 16 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <polyline points="20 6 9 17 4 12" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            Workout Complete
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 24, width: INNER }}>
            {[
              { label: 'Exercises', value: String(stats.exerciseCount) },
              { label: 'Duration', value: formatDuration(stats.elapsedSeconds) },
              { label: 'Volume', value: `${formatVolume(stats.totalVolume)} kg` },
            ].map(({ label, value }) => (
              <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginTop: 8 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: EXERCISE_LIST_GAP, marginTop: 24, flex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0, marginBottom: 4 }}>
            Exercise Summary
          </p>

          {exercises.map(({ group, groupVolume, sortedSets }) => (
            <div key={group.exercise_id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: EXERCISE_CARD_H }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: 12, flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M3 6.5v11M21 6.5v11M6.5 4v16M17.5 4v16" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>{group.name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>·</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'}</span>
                </div>
                <span style={{ color: '#CCF200', fontSize: 13, fontWeight: 900 }}>{groupVolume} kg</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', gap: 8, padding: 10, flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
                  {sortedSets.slice(0, Math.ceil(sortedSets.length / 2)).map((set, idx) => (
                    <div key={set.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 9999, background: 'rgba(204,242,0,0.2)', color: '#CCF200', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <span style={{ color: 'white', fontSize: 13, fontWeight: 500, flex: 1 }}>
                        {set.weight > 0 ? `${set.weight} ${set.weight_unit}` : '—'}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>×</span>
                      <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>
                        {set.reps} <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>reps</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
                  {sortedSets.slice(Math.ceil(sortedSets.length / 2)).map((set, idx) => (
                    <div key={set.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 9999, background: 'rgba(204,242,0,0.2)', color: '#CCF200', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {Math.ceil(sortedSets.length / 2) + idx + 1}
                      </div>
                      <span style={{ color: 'white', fontSize: 13, fontWeight: 500, flex: 1 }}>
                        {set.weight > 0 ? `${set.weight} ${set.weight_unit}` : '—'}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>×</span>
                      <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>
                        {set.reps} <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>reps</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, letterSpacing: '0.1em', margin: 0 }}>{stats.date}</p>
        </div>
      </div>
    );

    // Render JSX to PNG via @vercel/og ImageResponse
    return new ImageResponse(jsx, {
      width: CARD_W,
      height: CARD_H,
    });
  } catch (e: any) {
    console.error('Poster generation error:', e);
    return new NextResponse(`Error: ${e.message}`, { status: 500 });
  }
}
