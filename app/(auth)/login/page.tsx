'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
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
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user_id', res.data.data.user_id);
        localStorage.setItem('user_name', res.data.data.user_name);
        router.push('/');
      } else {
        setError(res.data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <span className="material-symbols-outlined text-primary-fixed text-4xl">bolt</span>
        <h1 className="text-4xl font-black text-lime-400 tracking-widest uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>
          PULSE_FIT
        </h1>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md space-y-6">
        <div className="glass-card rounded-2xl p-6 space-y-5">
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

          {error && (
            <div className="text-error text-sm font-medium">{error}</div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 bg-primary-fixed text-black font-bold rounded-full hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            {loading ? 'Loading...' : 'Login / 登录'}
          </button>

          <button
            onClick={() => router.push('/register')}
            className="w-full py-4 border border-secondary-container text-secondary rounded-full hover:bg-surface-container transition-colors"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            Register / 注册
          </button>
        </div>
      </div>

      {/* Demo account hint */}
      <div className="mt-8 text-center text-neutral-500 text-sm">
        <p>Demo account: username: 2 / password: 2</p>
      </div>
    </div>
  );
}
