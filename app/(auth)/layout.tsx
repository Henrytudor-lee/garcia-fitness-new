'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary-fixed font-display text-2xl animate-pulse">PULSE_FIT</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {children}
    </div>
  );
}
