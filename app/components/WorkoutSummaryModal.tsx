'use client';

import { useState, useRef, useEffect } from 'react';
import { toBlob, toCanvas } from 'html-to-image';
import { Download, Share2, Dumbbell } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface SetData {
  id: number;
  weight: number;
  reps: number;
  weight_unit: string;
  sequence: number;
}

interface ExerciseGroup {
  exercise_id: number;
  name: string;
  image_name: string | null;
  sets: SetData[];
}

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    exerciseCount: number;
    totalVolume: number;
    elapsedSeconds: number;
    date: string;
    groups: ExerciseGroup[];
  };
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

const formatVolume = (vol: number) => {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
  return String(vol);
};

// Poster content shared between visible and hidden versions
function PosterContent({ stats }: { stats: WorkoutSummaryModalProps['stats'] }) {
  return (
    <>
      {/* CSS gradient background (reliable, no external image dependency for capture) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)',
        }}
      />
      {/* Decorative accent blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-60px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(204,242,0,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '40px',
          left: '-30px',
          width: '160px',
          height: '160px',
          background: 'radial-gradient(circle, rgba(139,195,74,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Top gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none" />

      {/* Top section: logo + checkmark + complete text */}
      <div className="relative z-10 px-6 pt-8 pb-4 text-center">
        {/* GFIT logo */}
        <span
          className="text-3xl font-black tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #CCF200, #F2E500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          GFIT
        </span>

        {/* Big checkmark */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto my-5"
          style={{ background: 'linear-gradient(135deg, #CCF200, #8BC34A)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-black" strokeWidth={3} stroke="currentColor">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-white/80 text-sm uppercase tracking-widest font-bold">Workout Complete</p>

        {/* Stats row */}
        <div className="flex gap-3 mt-5">
          {[
            { label: 'Exercises', value: stats.exerciseCount },
            { label: 'Duration', value: formatDuration(stats.elapsedSeconds) },
            { label: 'Volume', value: `${formatVolume(stats.totalVolume)} kg` },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 bg-white/10 backdrop-blur-md rounded-xl py-3 flex flex-col items-center gap-1">
              <span className="text-lg font-black text-white leading-none">{value}</span>
              <span className="text-[9px] text-white/50 uppercase tracking-wider leading-none">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10 mx-6 h-px bg-white/10" />

      {/* Exercise list — NO max-height, expands fully for screenshot */}
      <div className="relative z-10 px-6 pb-6 pt-4">
        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-3">Exercise Summary</p>
        <div className="space-y-4">
          {stats.groups.map((group) => (
            <div key={group.exercise_id} className="bg-white/5 rounded-xl overflow-hidden">
              {/* Exercise header with image */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                {/* Exercise image */}
                {group.image_name ? (
                  <img
                    src={group.image_name}
                    alt={group.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={18} className="text-white/40" />
                  </div>
                )}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{group.name}</p>
                  <span className="text-white/30 text-xs flex-shrink-0">·</span>
                  <p className="text-white/40 text-xs flex-shrink-0">
                    {group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'}
                  </p>
                </div>
                <span className="text-primary-fixed text-xs font-black flex-shrink-0">
                  {group.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0)} kg
                </span>
              </div>
              {/* Sets grid — 2 columns like Current Workout */}
              <div className="p-2 grid grid-cols-2 gap-1.5">
                {group.sets.map((set, idx) => (
                  <div key={set.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                    <span className="w-5 h-5 rounded-full bg-primary-fixed/20 text-primary-fixed text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-white text-xs font-medium flex-1">
                      {set.weight > 0 ? `${set.weight} ${set.weight_unit}` : '—'}
                    </span>
                    <span className="text-white/40 text-xs">×</span>
                    <span className="text-white text-xs font-medium flex-shrink-0">
                      {set.reps} <span className="text-white/40 text-[10px]">reps</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date footer */}
      <div className="relative z-10 px-6 pb-5 text-center">
        <p className="text-white/25 text-xs tracking-wider">{stats.date}</p>
      </div>
    </>
  );
}

export default function WorkoutSummaryModal({
  isOpen,
  onClose,
  stats,
}: WorkoutSummaryModalProps) {
  const { t } = useI18n();
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Screen-visible poster (scrollable, max height)
  const posterRef = useRef<HTMLDivElement>(null);
  // Hidden full-size poster used only for screenshot capture
  const fullPosterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Sync scroll position when modal opens
    const el = posterRef.current;
    if (el) el.scrollTop = 0;
  }, [isOpen]);

  if (!isOpen) return null;

  const capturePoster = async () => {
    const ref = posterRef.current;
    if (!ref) return null;
    try {
      // Expand element to full content height so html-to-image captures everything
      const origOverflow = ref.style.overflow;
      const origMaxHeight = ref.style.maxHeight;
      const origHeight = ref.style.height;
      ref.style.overflow = 'visible';
      ref.style.maxHeight = 'none';
      ref.style.height = ref.scrollHeight + 'px';

      // Wait for DOM paint to ensure latest stats are rendered
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      let blob: Blob | null = null;
      try {
        blob = await toBlob(ref, {
          pixelRatio: 2,
          cacheBust: true,
          // Skip external images that may cause CORS/canvas errors
          filter: (node) => {
            if (node.tagName === 'IMG') {
              const img = node as HTMLImageElement;
              if (img.src && !img.src.startsWith(window.location.origin)) {
                return false;
              }
            }
            return true;
          },
        });
      } catch {
        // Fallback: try toCanvas then convert
      }
      if (!blob) {
        try {
          const canvas = await toCanvas(ref, { pixelRatio: 2, cacheBust: true });
          blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('canvas.toBlob failed'))), 'image/png', 1.0)
          );
        } catch {
          // both failed
        }
      }

      // Restore original styles
      ref.style.overflow = origOverflow;
      ref.style.maxHeight = origMaxHeight;
      ref.style.height = origHeight;

      return blob;
    } catch (err) {
      console.error('Capture failed:', err);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsCapturing(true);
    setCaptureError(null);
    try {
      const params = new URLSearchParams({
        data: encodeURIComponent(JSON.stringify(stats)),
      });
      const res = await fetch(`/api/poster?${params}`);
      if (!res.ok) throw new Error('Failed to generate poster');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GFIT_${stats.date.replace(/[\s,]/g, '')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setCaptureError('Capture failed, please try again');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    setIsCapturing(true);
    try {
      const params = new URLSearchParams({
        data: encodeURIComponent(JSON.stringify(stats)),
      });
      const res = await fetch(`/api/poster?${params}`);
      if (!res.ok) throw new Error('Failed to generate poster');
      const blob = await res.blob();
      const file = new File([blob], `GFIT_${stats.date.replace(/[\s,]/g, '')}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'GFIT Workout',
          text: `Just crushed ${stats.exerciseCount} exercises in ${formatDuration(stats.elapsedSeconds)}! 💪`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error('Share failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal container */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-4 max-h-[95vh]">

        {/* Screen-visible poster — scrollable, constrained height */}
        <div
          ref={posterRef}
          className="relative w-full rounded-2xl overflow-y-auto max-h-[85vh]"
          style={{ background: '#111111', minHeight: '500px' }}
        >
          <PosterContent stats={stats} />
        </div>

        {/* Hidden full-size poster for screenshot capture — never displayed, expands to content height */}
        <div
          ref={fullPosterRef}
          className="fixed left-[-9999px] top-0 w-full max-w-sm"
          style={{ background: '#111111' }}
          aria-hidden="true"
        >
          <PosterContent stats={stats} />
        </div>

        {/* Capture error */}
        {captureError && (
          <p className="text-red-400 text-xs text-center">{captureError}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleDownload}
            disabled={isCapturing}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 backdrop-blur-md text-white font-bold rounded-full hover:bg-white/20 transition-colors"
          >
            <Download size={18} />
            {isCapturing ? '...' : 'Download'}
          </button>
          <button
            onClick={handleShare}
            disabled={isCapturing}
            className="flex-1 flex items-center justify-center gap-2 py-3 font-bold rounded-full transition-colors text-black"
            style={{ background: 'linear-gradient(135deg, #CCF200, #8BC34A)' }}
          >
            <Share2 size={18} />
            {isCapturing ? '...' : 'Share'}
          </button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-2 text-white/50 text-sm hover:text-white transition-colors"
        >
          {t('edit.cancel')}
        </button>
      </div>
    </div>
  );
}
