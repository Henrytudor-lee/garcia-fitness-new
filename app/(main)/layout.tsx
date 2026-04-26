'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Library, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/contexts/I18nContext';

type Tab = 'training' | 'library' | 'stats' | 'profile';

const tabs = [
  { id: 'training' as Tab, href: '/', labelKey: 'nav.training', icon: Dumbbell },
  { id: 'library' as Tab, href: '/library', labelKey: 'nav.library', icon: Library },
  { id: 'stats' as Tab, href: '/stats', labelKey: 'nav.stats', icon: BarChart3 },
  { id: 'profile' as Tab, href: '/profile', labelKey: 'nav.profile', icon: User },
];

function TopAppBar() {
  return (
    <header
      data-nav
      className="fixed top-0 left-0 w-full z-50 flex justify-center items-center px-5 h-16 border-b"
      style={{ background: 'var(--color-nav-bg)', borderColor: 'var(--color-divider)' }}
    >
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="G-FIT" className="w-7 h-7 object-contain" />
        <h1 className="text-xl font-black text-primary-fixed tracking-widest font-lexend uppercase">GFIT</h1>
      </div>
    </header>
  );
}

function BottomNavBar({ activeTab, t }: { activeTab: Tab; t: (key: string) => string }) {
  return (
    <nav
      data-nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 border-t"
      style={{ background: 'var(--color-nav-bg)', borderColor: 'var(--color-divider)' }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-200",
              isActive ? "text-primary-fixed scale-110" : "text-neutral-500"
            )}
          >
            <tab.icon size={24} fill={isActive ? "currentColor" : "none"} />
            <span className="font-lexend text-[10px] font-bold uppercase mt-1">{t(tab.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function getActiveTab(pathname: string): Tab {
  if (pathname === '/') return 'training';
  if (pathname === '/library') return 'library';
  if (pathname === '/stats') return 'stats';
  if (pathname === '/profile') return 'profile';
  return 'training';
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="flex flex-col min-h-screen pb-32" style={{ background: 'var(--color-background)' }}>
      <TopAppBar />
      <main className="flex-grow pt-20 px-5">
        {children}
      </main>
      <BottomNavBar activeTab={getActiveTab(pathname)} t={t} />
    </div>
  );
}
