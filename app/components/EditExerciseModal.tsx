'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { exerciseApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useI18n } from '@/contexts/I18nContext';

interface SetItem {
  id: number;
  weight: number;
  reps: number;
  weight_unit: string;
  sequence: number;
  create_time: string;
  _deleted?: boolean; // marked for deletion, not yet sent to server
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  group: {
    exercise_id: number;
    name: string;
    image_name: string | null;
    sets: SetItem[];
  } | null;
  sessionId: number | null;
  onSaved: () => void;
}

const UNITS = ['kg', 'lb'];

export default function EditExerciseModal({ isOpen, onClose, group, sessionId, onSaved }: Props) {
  const { t } = useI18n();
  const [sets, setSets] = useState<SetItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) {
      setSets(group.sets.map(s => ({ ...s })));
    }
  }, [group]);

  if (!group) return null;

  const updateSet = (index: number, field: keyof SetItem, value: any) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const deleteSet = (index: number) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, _deleted: true } : s));
  };

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets(prev => [...prev, {
      id: Date.now(), // temporary id, will be assigned by server
      weight: last?.weight || 20,
      reps: last?.reps || 10,
      weight_unit: last?.weight_unit || 'kg',
      sequence: prev.length,
      create_time: new Date().toISOString(),
    }]);
  };

  const saveAll = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {

      // Update each changed set and add new ones
      for (let i = 0; i < sets.length; i++) {
        const s = sets[i];
        if (s._deleted) continue;
        const original = group.sets.find(os => os.id === s.id);
        // Only update if changed
        if (original && (original.weight !== s.weight || original.reps !== s.reps || original.weight_unit !== s.weight_unit)) {
          await exerciseApi.updateSet(s.id, s.weight, s.reps, s.weight_unit);
        }
        // New set (has temporary id)
        if (!original && s.id > Date.now() - 100000) {
          await exerciseApi.addSet(sessionId!, group.exercise_id, s.weight, s.reps, s.weight_unit);
        }
      }

      // Delete sets marked for deletion
      const toDelete = sets.filter(s => s._deleted && s.id <= Date.now() - 100000);
      for (const s of toDelete) {
        await exerciseApi.deleteSet(s.id);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl overflow-hidden flex flex-col"
            style={{ background: 'var(--color-surface-container)', maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-divider)' }}>
              <div className="flex items-center gap-3">
                {group.image_name ? (
                  <img src={group.image_name} alt={group.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-fixed">#</span>
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>{group.name}</h2>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {sets.length} {sets.length === 1 ? 'set' : 'sets'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addSet}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-primary-fixed text-black font-bold"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--color-input-bg)', color: 'var(--color-text-secondary)' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sets list — flex-1 + overflow-y-auto fills remaining space */}
            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="p-5 space-y-3">
                {sets.map((s, idx) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl transition-opacity",
                      s._deleted ? "opacity-30" : ""
                    )}
                    style={{ background: 'var(--color-input-bg)' }}
                  >
                    {/* Set number */}
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--color-primary-fixed)', color: 'black' }}
                    >
                      {idx + 1}
                    </span>

                    {/* Weight */}
                    <div className="flex-1 min-w-0">
                      <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                        {t('edit.weight')}
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateSet(idx, 'weight', Math.max(0, s.weight - 2.5))}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--color-card-bg)', color: 'var(--color-text-secondary)' }}
                        >
                          <Minus size={10} />
                        </button>
                        <input
                          type="number"
                          value={s.weight}
                          onChange={(e) => updateSet(idx, 'weight', Number(e.target.value))}
                          className="w-14 text-center font-bold text-xs rounded-lg px-1 py-1 bg-transparent border focus:outline-none focus:border-primary-fixed"
                          style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-primary)' }}
                          min={0}
                          step={2.5}
                        />
                        <button
                          onClick={() => updateSet(idx, 'weight', s.weight + 2.5)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--color-card-bg)', color: 'var(--color-text-secondary)' }}
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Unit toggle */}
                    <div className="flex-shrink-0">
                      <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                        {t('edit.unit')}
                      </label>
                      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-divider)' }}>
                        {UNITS.map(u => (
                          <button
                            key={u}
                            onClick={() => updateSet(idx, 'weight_unit', u)}
                            className="py-1 px-2 text-[10px] font-bold uppercase transition-colors"
                            style={{
                              background: s.weight_unit === u ? 'var(--color-primary-fixed)' : 'transparent',
                              color: s.weight_unit === u ? 'black' : 'var(--color-text-secondary)',
                            }}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reps */}
                    <div className="flex-shrink-0">
                      <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                        {t('edit.reps')}
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateSet(idx, 'reps', Math.max(1, s.reps - 1))}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--color-card-bg)', color: 'var(--color-text-secondary)' }}
                        >
                          <Minus size={10} />
                        </button>
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) => updateSet(idx, 'reps', Number(e.target.value))}
                          className="w-10 text-center font-bold text-xs rounded-lg px-1 py-1 bg-transparent border focus:outline-none focus:border-primary-fixed"
                          style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-primary)' }}
                          min={1}
                        />
                        <button
                          onClick={() => updateSet(idx, 'reps', s.reps + 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--color-card-bg)', color: 'var(--color-text-secondary)' }}
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteSet(idx)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save button — flex-shrink-0 keeps it always visible */}
            <div className="p-5 pt-0 flex-shrink-0" style={{ background: 'var(--color-surface-container)' }}>
              <button
                onClick={saveAll}
                disabled={saving}
                className="w-full py-3.5 rounded-full font-bold text-sm uppercase tracking-wider transition-opacity"
                style={{ background: 'var(--color-primary-fixed)', color: 'black' }}
              >
                {saving ? 'Saving...' : t('edit.save')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
