'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Camera, Flame, Trophy, Languages, Moon, Sun, Settings, Lock, ChevronRight, LogOut, LogIn
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { profileApi } from '@/lib/api';

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBol-XJh9i0KlRtP2wm0j--vVdi6mziB74850b-xh9JHAtmp53lz_eMLPmHKbg03Y6fP2NSa7_6yBa_3T9wYMTL75vl5HSUlW6i7vSvx3nfZyPCs7dlSQVq6g3h8RMVySP6q1GkIqAPahUMcuKIflX_NdgauDeXeYSMvBeo5F33ICqrgWCRbjfQ76-bG0Sz3oDHZZxIPGXt4eJpj1uVpbqbXyvEzB3MsT4dM4sR5Aso_WxadMISG-liWPr0vIsX0v4G2AriMwkSIA';

function NotLoggedIn() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-20 h-20 rounded-full bg-primary-fixed/10 flex items-center justify-center">
        <LogIn size={40} className="text-primary-fixed" />
      </div>
      <div className="text-center">
        <p className="text-lg font-lexend font-black uppercase">{t('profile.login_required')}</p>
        <p className="text-sm text-neutral-500 mt-1">{t('profile.login_hint')}</p>
      </div>
      <button
        onClick={() => router.push('/login')}
        className="bg-primary-fixed text-black font-lexend font-black text-base px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(204,242,0,0.3)] active:scale-95 transition-all uppercase tracking-widest"
      >
        {t('profile.login_btn')}
      </button>
    </div>
  );
}

// Fire color tiers: 0=gray, 1-7=orange, 8-30=yellow, 31-60=lime, 61-120=green, 121-360=teal, 361+=blue
function getFlameColor(streak: number): string {
  if (streak === 0) return 'text-neutral-600';
  if (streak <= 7) return 'text-orange-500';
  if (streak <= 30) return 'text-yellow-400';
  if (streak <= 60) return 'text-primary-fixed';
  if (streak <= 120) return 'text-green-400';
  if (streak <= 360) return 'text-teal-400';
  return 'text-blue-400';
}

// Trophy color by level: ROOKIE=gray, BEGINNER=orange, INTERMEDIATE=yellow, ADVANCED=lime, EXPERT=green, ELITE=blue
function getTrophyColor(lv: number): string {
  if (lv <= 1) return 'text-neutral-600';
  if (lv === 2) return 'text-orange-500';
  if (lv === 3) return 'text-yellow-400';
  if (lv === 4) return 'text-primary-fixed';
  if (lv === 5) return 'text-green-400';
  return 'text-blue-400';
}

export default function ProfilePage() {
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('user_id')) : 0;

  if (!userId) {
    return (
      <div className="pb-10 max-w-[440px] mx-auto">
        <NotLoggedIn />
      </div>
    );
  }

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);

  const [streak, setStreak] = useState(0);
  const [levelData, setLevelData] = useState<{ label: string; lv: number; score: number }>({ label: 'ROOKIE', lv: 1, score: 0 });
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) return;
    const stored = localStorage.getItem('user_name');
    if (stored) setUserName(stored);
    const storedEmail = localStorage.getItem('user_email');
    if (storedEmail) setUserEmail(storedEmail);

    Promise.all([
      profileApi.getStreak(userId),
      profileApi.getLevel(userId),
    ]).then(([streakRes, levelRes]) => {
      if (streakRes.success && streakRes.data) setStreak(streakRes.data.streak);
      if (levelRes.success && levelRes.data) setLevelData(levelRes.data);
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setAvatar(base64);
      // Save to localStorage immediately
      localStorage.setItem('user_avatar', base64);
      // Sync to DB
      await profileApi.updateAvatar(userId, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_avatar');
    router.push('/login');
  };

  const handleLanguageToggle = () => {
    setLocale(locale === 'en' ? 'zh' : 'en');
  };

  const levelFontSize = levelData.label.length >= 6 ? 'text-xl' : levelData.label.length >= 5 ? 'text-2xl' : 'text-3xl';

  return (
    <div className="space-y-8 pb-10 max-w-[440px] mx-auto">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div className="relative group p-1">
          <div className="absolute inset-0 bg-primary-fixed blur-3xl opacity-10" />
          <div className="relative w-28 h-28 rounded-full border-2 border-primary-fixed p-1">
            <img
              src={avatar}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 bg-primary-fixed text-black p-1.5 rounded-full shadow-xl"
          >
            <Camera size={16} strokeWidth={3} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="mt-5 text-center">
           <h2 className="text-2xl font-lexend font-black uppercase tracking-tight">{userName || 'Fitness User'}</h2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
         <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
            <Flame className={`absolute top-2 right-2 transition-colors ${getFlameColor(streak)}`} size={48} />
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('profile.active_streak')}</p>
            <p className="text-3xl font-lexend font-bold mt-2">
              {loading ? '—' : streak}
              <span className="text-xs text-neutral-600 ml-1">{t('profile.days')}</span>
            </p>
         </div>
         <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
            <Trophy className={`absolute top-2 right-2 transition-colors ${getTrophyColor(levelData.lv)}`} size={48} />
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('profile.level')}</p>
            <p className={`${levelFontSize} font-lexend font-bold mt-2`}>
              {loading ? '—' : levelData.label}
            </p>
            <p className="text-xs text-neutral-600 mt-0.5">{t('profile.lv')}.{levelData.lv}</p>
         </div>
      </div>

      {/* Settings list */}
      <div className="space-y-3">
         {/* Language */}
         <div
           onClick={handleLanguageToggle}
           className="glass-card rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:bg-white/10 transition-all"
         >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                  <Languages size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold">{t('profile.language')}</p>
                  <p className="text-[10px] text-neutral-500 font-semibold uppercase">{locale === 'en' ? 'English (US)' : '中文'}</p>
               </div>
            </div>
            <div className="flex bg-black/40 rounded-full p-1 border border-white/5">
              <span className={locale === 'en' ? 'px-3 py-1 bg-primary-fixed text-black text-[10px] font-black rounded-full' : 'px-3 py-1 text-neutral-600 text-[10px] font-black rounded-full'}>EN</span>
              <span className={locale === 'zh' ? 'px-3 py-1 bg-primary-fixed text-black text-[10px] font-black rounded-full' : 'px-3 py-1 text-neutral-600 text-[10px] font-black rounded-full'}>CN</span>
            </div>
         </div>

         {/* Theme */}
         <div
           onClick={toggleTheme}
           className="glass-card rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:bg-white/10 transition-all"
         >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} className="text-amber-400" />}
               </div>
               <div>
                  <p className="text-sm font-bold">{t('profile.theme')}</p>
                  <p className="text-[10px] text-neutral-500 font-semibold uppercase">{theme === 'dark' ? t('theme.dark') : t('theme.light')}</p>
               </div>
            </div>
            <div className="flex bg-black/40 rounded-full p-1 border border-white/5">
              <span className={theme === 'dark' ? 'px-3 py-1 bg-neutral-700 text-white text-[10px] font-black rounded-full' : 'px-3 py-1 text-neutral-600 text-[10px] font-black rounded-full'}>{t('theme.dark')}</span>
              <span className={theme === 'light' ? 'px-3 py-1 bg-amber-400 text-black text-[10px] font-black rounded-full' : 'px-3 py-1 text-neutral-600 text-[10px] font-black rounded-full'}>{t('theme.light')}</span>
            </div>
         </div>

         {/* AI Coach (coming soon) */}
         <div className="glass-card rounded-2xl p-4 flex items-center justify-between opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-600">
                  <Settings size={20} />
               </div>
               <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-neutral-500 underline decoration-dotted">{t('profile.ai_coach')}</p>
                    <span className="text-[8px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">{t('profile.soon')}</span>
                  </div>
                  <p className="text-[10px] text-neutral-700 font-semibold uppercase tracking-widest pt-0.5">{t('profile.ai_subtitle')}</p>
               </div>
            </div>
            <Lock className="text-neutral-800" size={18} />
         </div>

         {/* Settings */}
         <div className="glass-card rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:bg-white/10 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors">
                  <Settings size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold">{t('profile.settings')}</p>
                  <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">{t('profile.settings_sub')}</p>
               </div>
            </div>
            <ChevronRight className="text-neutral-700" size={20} />
         </div>

         {/* Logout */}
         <button
          onClick={handleLogout}
          className="w-full glass-card rounded-2xl p-4 flex items-center justify-between group active:bg-red-500/10 transition-all border-red-500/5 hover:border-red-500/20"
        >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <LogOut size={20} />
               </div>
               <div className="text-left">
                  <p className="text-sm font-bold text-red-500">{t('profile.logout')}</p>
                  <p className="text-[10px] text-red-500/40 font-semibold uppercase tracking-widest">{t('profile.logout_sub')}</p>
               </div>
            </div>
         </button>
      </div>

      <p className="text-center text-[10px] font-black text-neutral-800 uppercase tracking-[0.4em] pt-4">{t('app.name')} V1.0.2 - STABLE</p>
    </div>
  );
}
