'use client';

import { useEffect, useState } from 'react';
import { RssIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/Loading';
import { useSession } from '@/hooks/useSession';

type Feed = {
  id: string;
  title: string;
  description: string;
  link: string;
};

export default function Feeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const session = useSession();

  useEffect(() => {
    (async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feeds`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Fetch failed', response.status, response.statusText);
        toast.error('Failed to fetch feeds');
      }

      const feeds = await response.json();
      setFeeds(feeds);
    })();
  }, []);

  if (!session) {
    return <Loading />;
  }

  const handleCopyFeedUrl = async (feedId: string) => {
    if (!feedId) return;
    try {
      await navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_API_URL}/feeds/${feedId}`,
      );
      toast.success('Feed URL copied to clipboard');
    } catch {
      toast.error('Failed to copy feed URL');
    }
  };

  return (
    <main className="mt-4 p-4">
      <h2 className="text-3xl font-bold">feeds</h2>
      {feeds.map((feed) => {
        return (
          <div key={feed.id} className="flex py-4">
            <div className="flex-1">
              <h3 className="font-bold text-xl">{feed.title}</h3>
              <p>{feed.description}</p>
            </div>
            <div className="flex items-center">
              <Button onClick={() => handleCopyFeedUrl(feed.id)}>
                <RssIcon />
              </Button>
            </div>
          </div>
        );
      })}
    </main>
  );
}
