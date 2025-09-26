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

    // Session gained since last render, user signing in
    const wasSignedIn = prevSessionRef.current === null && session !== null;

    // Session cleared since last render, user signing out
    const wasSignedOut = prevSessionRef.current !== null && session === null;

    prevSessionRef.current = session;

    // Sign-in redirect handled in SignInForm
    if (wasSignedIn && pathname === '/signin') return;

    if (!session && !wasSignedOut) {
      // Public pages do not require redirect
      if (pathname === '/signin' || pathname === '/signup') {
        return;
      }

      // Redirect param not required for root page (default behaviour)
      if (pathname === '/') {
        router.push('/signin');
        return;
      }

      // Use redirect param to return to previous page after sign-in
      const redirect = encodeURIComponent(pathname);
      router.push(`/signin?redirect=${redirect}`);
    }
  }, [isPending, session, router, pathname]);

  return session;
}
