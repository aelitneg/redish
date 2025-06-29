'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function useSession() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const prevSessionRef = useRef(session);

  useEffect(() => {
    if (isPending) return;

    // Session cleared since last render, user signing out
    const wasSignedOut = prevSessionRef.current !== null && session === null;
    prevSessionRef.current = session;

    if (!session && !wasSignedOut) {
      // Paths excluded from redirect redirect param
      if (pathname === '/signin' || pathname === '/') {
        router.push('/signin');
        return;
      }

      const redirect = encodeURIComponent(pathname);
      router.push(`/signin?redirect=${redirect}`);
    }
  }, [isPending, session, router, pathname]);

  return session;
}
