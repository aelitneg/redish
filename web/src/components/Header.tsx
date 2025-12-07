'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { MenuIcon, RssIcon, LogOutIcon } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

export function Header() {
  const router = useRouter();
  const session = useSession();
  const [feedId, setFeedId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/feeds`,
          {
            method: 'GET',
            credentials: 'include',
          },
        );
        if (!response.ok) {
          const { error } = await response.json();
          console.error(`Request Failed ${response.status} ${error}`);
          setFeedId(null);
          return;
        }
        const feeds = await response.json();
        setFeedId(feeds[0]?.id || null);
      } catch (err) {
        console.error(err);
        setFeedId(null);
      }
    })();
  }, [session]);

  async function signOut() {
    await authClient.signOut();
    router.replace('/signin');
  }

  return (
    <header className="p-4 flex">
      <h1 className="flex-1 text-4xl font-semibold">
        <Link href="/">redish</Link>
      </h1>
      {session && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="menu">
              <MenuIcon className="size-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {feedId && (
              <DropdownMenuItem
                onClick={() => router.push('/feeds')}
                className="flex items-center gap-2 w-full"
              >
                <RssIcon className="size-4" /> feeds
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} variant="destructive">
              <LogOutIcon className="size-4" /> sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
