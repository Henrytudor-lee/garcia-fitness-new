'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', icon: 'fitness_center', label: 'Training', active: false },
  { href: '/library', icon: 'library_books', label: 'Library', active: false },
  { href: '/stats', icon: 'monitoring', label: 'Stats', active: false },
  { href: '/profile', icon: 'person', label: 'Profile', active: false },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getNavItems = () => navItems.map(item => ({
    ...item,
    active: pathname === item.href || (item.href === '/' && pathname === '/'),
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 h-16 bg-black/70 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-fixed">bolt</span>
          <h1 className="text-2xl font-black text-lime-400 tracking-widest uppercase" style={{ fontFamily: 'Lexend, sans-serif' }}>
            PULSE_FIT
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-neutral-400 hover:text-primary-fixed transition-colors">
            <span className="material-symbols-outlined">dark_mode</span>
          </button>
          <button className="text-neutral-400 hover:text-primary-fixed transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">translate</span>
            <span className="text-xs font-bold uppercase">CN</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-5 max-w-5xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 pb-safe bg-black/80 backdrop-blur-2xl border-t border-white/5">
        {getNavItems().map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-all duration-150 rounded-full p-2 ${
              item.active 
                ? 'text-primary-fixed scale-110' 
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined ${item.active ? 'filled' : ''}`}>
              {item.icon}
            </span>
            <span 
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ fontFamily: 'Lexend, sans-serif' }}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
