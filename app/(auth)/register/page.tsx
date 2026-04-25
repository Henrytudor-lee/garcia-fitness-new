'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useI18n } from '@/contexts/I18nContext';

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBol-XJh9i0KlRtP2wm0j--vVdi6mziB74850b-xh9JHAtmp53lz_eMLPmHKbg03Y6fP2NSa7_6yBa_3T9wYMTL75vl5HSUlW6i7vSvx3nfZyPCs7dlSQVq6g3h8RMVySP6q1GkIqAPahUMcuKIflX_NdgauDeXeYSMvBeo5F33ICqrgWCRbjfQ76-bG0Sz3oDHZZxIPGXt4eJpj1uVpbqbXyvEzB3MsT4dM4sR5Aso_WxadMISG-liWPr0vIsX0v4G2AriMwkSIA';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authApi.register(email, password, name, avatar);
      if (res.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user_id', String(res.data.user_id));
        localStorage.setItem('user_name', res.data.user_name);
        localStorage.setItem('user_email', email);
        router.push('/');
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <img src="/logo.png" alt="G-FIT" className="w-[60px] h-[60px] object-contain" />
        <h1 className="text-4xl font-black text-primary-fixed tracking-widest uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>
          GFIT
        </h1>
      </div>

      {/* Avatar picker */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="absolute inset-0 bg-primary-fixed/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="text-white" size={24} />
          </div>
          <img
            src={avatar}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-primary-fixed/30"
          />
          <div className="absolute bottom-0 right-0 bg-primary-fixed text-black p-1.5 rounded-full shadow-lg">
            <Camera size={14} strokeWidth={3} />
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-2">Tap to upload photo</p>
      </div>

      {/* Register Form */}
      <div className="w-full max-w-md space-y-5">
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide">
              Name / 名字
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-white placeholder-neutral-500 border border-white/5 focus:border-primary-fixed focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide">
              Email / 邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-white placeholder-neutral-500 border border-white/5 focus:border-primary-fixed focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide">
              Password / 密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-white placeholder-neutral-500 border border-white/5 focus:border-primary-fixed focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wide">
              Confirm Password / 确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-white placeholder-neutral-500 border border-white/5 focus:border-primary-fixed focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm font-medium text-center">{error}</div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-4 bg-primary-fixed text-black font-bold rounded-full hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            {loading ? 'Loading...' : 'Register / 注册'}
          </button>

          <button
            onClick={() => router.push('/login')}
            className="w-full py-4 border border-secondary-container text-secondary rounded-full hover:bg-surface-container transition-colors"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            Back to Login / 返回登录
          </button>
        </div>
      </div>
    </div>
  );
}
