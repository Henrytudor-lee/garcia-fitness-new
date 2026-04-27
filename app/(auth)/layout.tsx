'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Always allow access to auth pages — don't auto-redirect logged-in users
    // The training page itself will show guest prompt for unauthenticated users
    setChecked(true);
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary-fixed font-display text-2xl animate-pulse">GFIT</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {children}
    </div>
  );
};
