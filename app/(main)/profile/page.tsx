'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('user_id')) : 0;
  const userName = typeof window !== 'undefined' ? localStorage.getItem('user_name') : '';
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') : '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    router.push('/login');
  };

  const menuItems = [
    { icon: 'person', label: 'Personal Info', subtitle: 'Name, email, phone', action: () => {} },
    { icon: 'notifications', label: 'Notifications', subtitle: 'Workout reminders', action: () => {} },
    { icon: 'language', label: 'Language', subtitle: 'English / 中文', action: () => {} },
    { icon: 'dark_mode', label: 'Theme', subtitle: 'Dark mode', action: () => {} },
    { icon: 'help', label: 'Help & Support', subtitle: 'FAQs, contact us', action: () => {} },
    { icon: 'info', label: 'About', subtitle: 'Version 1.0.0', action: () => {} },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
          Profile
        </h1>
        <p className="text-neutral-400 text-sm">Manage your account</p>
      </div>

      {/* Profile Card */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary-fixed/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-fixed text-4xl">person</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
              {userName || 'Athlete'}
            </h2>
            <p className="text-neutral-400 text-sm">{userEmail || `User #${userId}`}</p>
          </div>
          <button className="p-2 text-neutral-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-primary-fixed" style={{ fontFamily: 'Lexend, sans-serif' }}>
            12
          </p>
          <p className="text-neutral-400 text-xs uppercase">Sessions</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-secondary" style={{ fontFamily: 'Lexend, sans-serif' }}>
            156
          </p>
          <p className="text-neutral-400 text-xs uppercase">Exercises</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-white" style={{ fontFamily: 'Lexend, sans-serif' }}>
            7
          </p>
          <p className="text-neutral-400 text-xs uppercase">Days</p>
        </div>
      </div>

      {/* Menu List */}
      <div className="space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-surface-container transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-neutral-400">{item.icon}</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold">{item.label}</p>
              <p className="text-neutral-500 text-sm">{item.subtitle}</p>
            </div>
            <span className="material-symbols-outlined text-neutral-500">chevron_right</span>
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full py-4 border border-error text-error rounded-full hover:bg-error hover:text-black transition-colors font-bold"
        style={{ fontFamily: 'Lexend, sans-serif' }}
      >
        Logout / 退出
      </button>

      {/* App Version */}
      <div className="text-center text-neutral-600 text-sm">
        <p>PULSE_FIT v1.0.0</p>
      </div>
    </div>
  );
}
