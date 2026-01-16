'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/Loading';
import { useSession } from '@/hooks/useSession';

type FeedItem = {
  guid: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
};

type Feed = {
  id: string;
  title: string;
  description: string;
  link: string;
};

export default function FeedDetail() {
  const params = useParams<{ feedId: string }>();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingGuid, setDeletingGuid] = useState<string | null>(null);
  const session = useSession();

  const fetchFeed = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feeds`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Fetch failed', response.status, response.statusText);
      toast.error('Failed to fetch feed');
      return;
    }

    const feeds: Feed[] = await response.json();
    const currentFeed = feeds.find((f) => f.id === params.feedId);
    if (currentFeed) {
      setFeed(currentFeed);
    }
  };

  const fetchItems = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/feeds/${params.feedId}/items`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      console.error('Fetch failed', response.status, response.statusText);
      toast.error('Failed to fetch feed items');
      setIsLoading(false);
      return;
    }

    const items = await response.json();
    setItems(items);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFeed();
    fetchItems();
  }, [params.feedId]);

  const handleDelete = async (itemGuid: string) => {
    setDeletingGuid(itemGuid);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feeds/${params.feedId}/items/${itemGuid}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        console.error('Delete failed', response.status, response.statusText);
        toast.error('Failed to delete item');
        return;
      }

      await fetchItems();
      toast.success('Item deleted');
    } catch {
      toast.error('Failed to delete item');
    } finally {
      setDeletingGuid(null);
    }
  };

  if (!session || isLoading) {
    return <Loading />;
  }

  return (
    <main className="mt-4 p-4">
      <h2 className="text-3xl font-bold">{feed?.title ?? 'Feed'}</h2>
      {items.length === 0 ? (
        <p className="py-4 text-muted-foreground">No items in this feed yet.</p>
      ) : (
        items.map((item) => (
          <div key={item.guid} className="flex py-4 border-b">
            <div className="flex-1 min-w-0">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-xl hover:underline block truncate"
              >
                {item.title}
              </a>
              <p className="text-muted-foreground truncate">
                {item.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(item.pubDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center ml-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    disabled={deletingGuid === item.guid}
                  >
                    <Trash2Icon />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove &quot;{item.title}&quot; from your feed.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(item.guid)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
