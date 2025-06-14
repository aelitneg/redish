'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ItemForm } from '@/components/ItemForm';
import { authClient } from '@/lib/auth-client';

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session === null) {
      router.push('/signin');
    }
  }, [session, isPending, router]);

  if (!session) {
    return null;
  }

  return (
    <main className="flex-1 flex justify-center items-center">
      <div className="flex flex-col items-center w-full p-2">
        <ItemForm />
      </div>
    </main>
  );
}
