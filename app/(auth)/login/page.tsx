'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Bolt, Mail, Lock, Eye
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useI18n } from '@/contexts/I18nContext';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user_id', res.data.user_id);
        localStorage.setItem('user_name', res.data.user_name);
        localStorage.setItem('user_email', email);
        router.push('/');
      } else {
        setError(res.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZZWvmbz_YlF1dw1UBQiMWZVqvmMhVRwC5KwBI1Z7vd2FirIO1P_UPH0iAj9wkClRa9O1ewHBktLbfswupB8uYz_5BOJL1IlIlUfwMbnHbEReprWDhde5_N6U4atbaeHE-Hs5zJsGe7Wyi4db0V59q-_EDGOBZDF4OTIHPqI-NnM27EwxcK8b9nyS6ZMRb85wTPZEzCMVtjbYhEZ9wGs-mdeMMwRAHivJk9MJJtIdjNFLqNZFPIseZz8fsojAOPIuL8tq47F3G_g"
          className="w-full h-full object-cover opacity-20 grayscale brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      <header className="fixed top-0 left-0 w-full z-10 flex justify-center items-center h-16">
        <span className="font-lexend font-black text-2xl text-primary-fixed tracking-[0.2em] uppercase">G-FIT</span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-card rounded-2xl p-8 shadow-2xl relative z-10 mt-16"
      >
        <div className="text-center mb-10 mt-4">
          <h1 className="text-4xl font-lexend font-black uppercase tracking-tighter leading-none">{t('login.welcome')}</h1>
          <p className="text-neutral-400 text-sm font-semibold mt-3 uppercase tracking-widest">{t('login.subtitle')}</p>
        </div>

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">{t('login.email')}</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-primary-fixed transition-colors" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-black/40 border-0 border-b-2 border-white/10 focus:border-primary-fixed focus:ring-0 text-sm font-bold py-4 pl-12 pr-4 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t('login.password')}</label>
              <a href="#" className="text-[10px] font-bold text-primary-fixed hover:underline">Forgot?</a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-primary-fixed transition-colors" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border-0 border-b-2 border-white/10 focus:border-primary-fixed focus:ring-0 text-sm font-bold py-4 pl-12 pr-20 transition-all"
              />
              <Eye className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm font-medium text-center">{error}</div>
          )}

          <div className="pt-4 space-y-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-fixed text-black font-lexend font-black text-xl py-4 rounded-xl shadow-[0_0_25px_rgba(204,242,0,0.3)] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
            >
                {loading ? 'Logging in...' : t('login.login_btn')}
            </button>
            <div className="flex items-center gap-4">
              <div className="h-px flex-grow bg-white/5" />
              <span className="text-[8px] font-black text-neutral-600 uppercase tracking-[0.3em]">{t('login.or_continue')}</span>
              <div className="h-px flex-grow bg-white/5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="flex items-center justify-center gap-2 border border-white/5 py-3.5 rounded-xl hover:bg-white/5 transition-all active:scale-95">
                 <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuB2x1VGeiF3b20u0iRTm2l69Yy0rHmW8Gm4NtEhG_yeWh3kUHEjrGW0Wl-zGUzQZS5kUzkRWdirfGRh5py9PSOulKQ0VFjcWS0J9ZNziL4GKVswith6G40I881IX1yZ_nC4QfVK4I3tM_bpSoC2nGqzPK5cB0rdCXDuSq3dMhvI9qg_qvg-EO245nmesmDvY7vZVJh4tMgQjkhs40rvJpSi0h28BnZQ1SKDeNHLRfZLb2PY-ILbZyycxppaCUoONT_SmBdlMxaw" className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase">Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-2 border border-white/5 py-3.5 rounded-xl hover:bg-white/5 transition-all active:scale-95">
                 <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <div className="w-2 h-2 bg-black rounded-full" />
                 </div>
                 <span className="text-[10px] font-black uppercase">Apple</span>
              </button>
            </div>
          </div>
        </form>

        <p className="text-center mt-12 text-sm font-semibold text-neutral-500">
           {t('login.new_user')} <a onClick={() => router.push('/register')} className="text-primary-fixed ml-1 font-bold cursor-pointer">{t('login.create')}</a>
        </p>
      </motion.div>

      <div className="mt-8 w-full max-w-sm grid grid-cols-2 gap-3 relative z-10">
         <div className="glass-card p-4 rounded-2xl">
            <Bolt className="text-primary-fixed mb-2" size={16} />
            <p className="text-2xl font-lexend font-black">50k+</p>
            <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Active Athletes</p>
         </div>
         <div className="glass-card p-4 rounded-2xl">
            <Bolt className="text-primary-fixed mb-2" size={16} />
            <p className="text-2xl font-lexend font-black">99%</p>
            <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Accuracy Rate</p>
         </div>
      </div>

      <footer className="mt-8 text-center relative z-10">
         <p className="text-[8px] font-black text-neutral-800 uppercase tracking-[0.5em]">G-FIT Ecosystem © 2026</p>
      </footer>
    </div>
  );
}
