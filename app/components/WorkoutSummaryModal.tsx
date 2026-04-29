'use client';

import { useState, useRef } from 'react';
import { toBlob } from 'html-to-image';
import { Download, Share2 } from 'lucide-react';
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

export default function WorkoutSummaryModal({
  isOpen,
  onClose,
  stats,
}: WorkoutSummaryModalProps) {
  const { t } = useI18n();
  const [isCapturing, setIsCapturing] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setIsCapturing(true);
    try {
      const blob = await toBlob(posterRef.current, { pixelRatio: 2, cacheBust: true });
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GFIT_${stats.date.replace(/[\s,]/g, '')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    if (!posterRef.current) return;
    setIsCapturing(true);
    try {
      const blob = await toBlob(posterRef.current, { pixelRatio: 2, cacheBust: true });
      if (!blob) return;
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

  // Sticky header height so we can offset the scroll area
  const HEADER_H = 200; // approx px for top section in poster

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal container */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-4 max-h-[95vh]">

        {/* Poster — scrollable on screen, overflow hidden when captured */}
        <div
          ref={posterRef}
          className="relative w-full rounded-2xl overflow-hidden"
          style={{ background: '#111111', minHeight: '600px' }}
        >
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
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

          {/* Exercise list */}
          <div className="relative z-10 px-6 pb-6 pt-4">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-3">Exercise Summary</p>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {stats.groups.map((group) => (
                <div
                  key={group.exercise_id}
                  className="bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{group.name}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">
                      {group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'}
                      {' · '}
                      {group.sets.map((s, i) => (
                        <span key={s.id}>
                          {s.weight > 0 ? `${s.weight}kg×${s.reps}` : `${s.reps} reps`}
                          {i < group.sets.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  </div>
                  {/* Volume badge */}
                  <div className="flex-shrink-0 text-right">
                    <span className="text-primary-fixed text-sm font-black">
                      {formatVolume(group.sets.reduce((sum, s) => sum + s.weight * s.reps, 0))}
                    </span>
                    <span className="text-white/30 text-[10px]"> kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date footer */}
          <div className="relative z-10 px-6 pb-5 text-center">
            <p className="text-white/25 text-xs tracking-wider">{stats.date}</p>
          </div>
        </div>

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
