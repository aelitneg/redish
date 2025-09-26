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
      // Don't redirect if we're already on auth pages
      if (pathname === '/signin' || pathname === '/signup') {
        return;
      }

      // For root page, redirect directly to signin without redirect param
      if (pathname === '/') {
        router.push('/signin');
        return;
      }

      // For other protected pages, include redirect param
      const redirect = encodeURIComponent(pathname);
      router.push(`/signin?redirect=${redirect}`);
    }
  }, [isPending, session, router, pathname]);

  return session;
}
