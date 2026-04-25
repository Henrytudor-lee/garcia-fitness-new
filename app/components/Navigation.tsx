'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bolt, Languages, Moon, Dumbbell, Library, BarChart3, User, Plus } from 'lucide-react';

export function TopAppBar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 h-16 bg-black/70 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center gap-2">
        <Bolt className="text-primary-fixed" size={24} />
        <h1 className="text-xl font-black text-primary-fixed tracking-widest font-lexend uppercase">GFIT</h1>
      </div>
      <div className="flex items-center gap-4 text-neutral-400">
        <Moon size={20} />
        <div className="flex items-center gap-1">
          <Languages size={20} />
          <span className="text-xs font-bold font-lexend">CN</span>
        </div>
      </div>
    </header>
  );
}

export function BottomNavBar({ activeTab }: { activeTab: string }) {
  const tabs = [
    { id: '/', label: 'Training', icon: Dumbbell },
    { id: '/library', label: 'Library', icon: Library },
    { id: '/stats', label: 'Stats', icon: BarChart3 },
    { id: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      <div className="fixed bottom-24 right-5 z-40">
        <button className="w-14 h-14 bg-primary-fixed rounded-full shadow-[0_0_20px_rgba(204,242,0,0.4)] flex items-center justify-center text-black active:scale-90 transition-transform">
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.id}
              className={`flex flex-col items-center justify-center transition-all duration-200 ${
                isActive ? 'text-primary-fixed scale-110' : 'text-neutral-500'
              }`}
            >
              <tab.icon size={24} fill={isActive ? 'currentColor' : 'none'} />
              <span className="font-lexend text-[10px] font-bold uppercase mt-1">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
