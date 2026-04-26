'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, Eye, X, MessageCircle
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
  const [showForgot, setShowForgot] = useState(false);

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
    <div className="min-h-screen bg-background flex flex-col items-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#ccf200] 0%, #4d6600 25%, #1a1a1a 60%, #000000 100%" />

      <header className="fixed top-0 left-0 w-full z-10 flex justify-center items-center h-16">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="GFIT" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-lexend font-black text-2xl text-primary-fixed tracking-[0.2em] uppercase">G-FIT</span>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-card rounded-2xl p-8 shadow-2xl relative z-10 mt-20"
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
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-[10px] font-bold text-primary-fixed hover:underline cursor-pointer"
              >
                Forgot?
              </button>
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

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-fixed text-black font-lexend font-black text-xl py-4 rounded-xl shadow-[0_0_25px_rgba(204,242,0,0.3)] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
            >
                {loading ? 'Logging in...' : t('login.login_btn')}
            </button>
          </div>
        </form>

        <p className="text-center mt-12 text-sm font-semibold text-neutral-500">
           {t('login.new_user')} <a onClick={() => router.push('/register')} className="text-primary-fixed ml-1 font-bold cursor-pointer">{t('login.create')}</a>
        </p>
      </motion.div>

      <div className="flex flex-col items-center justify-center relative z-10 text-center px-8 pb-12 mt-auto">
        <p className="font-lexend font-black text-3xl md:text-4xl text-black leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
          Pain is temporary.<br />Quitting lasts forever.
        </p>
        <p className="mt-8 text-sm font-bold text-black/50 uppercase tracking-[0.3em]">by GarciaLee</p>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgot(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed/10 flex items-center justify-center">
                    <MessageCircle size={20} className="text-primary-fixed" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Contact Developer</h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">联系开发者</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForgot(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-neutral-400 text-sm mb-4">
                For account issues or password reset, please contact the developer directly.
              </p>
              <a
                href="mailto:tlee4014@gmail.com?subject=GFIT Account Help"
                className="flex items-center gap-3 bg-black/40 rounded-xl p-4 hover:bg-white/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-fixed/10 flex items-center justify-center">
                  <Mail size={18} className="text-primary-fixed" />
                </div>
                <div>
                  <p className="text-sm font-bold">tlee4014@gmail.com</p>
                  <p className="text-[10px] text-neutral-500">Tap to send email</p>
                </div>
              </a>
              <button
                onClick={() => setShowForgot(false)}
                className="w-full mt-4 py-3 text-center text-xs font-bold text-neutral-500 hover:text-white transition-colors"
              >
                Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
