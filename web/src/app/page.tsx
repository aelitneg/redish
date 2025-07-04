'use client';

import { ItemForm } from '@/components/ItemForm';
import { Loading } from '@/components/Loading';
import { useSession } from '@/hooks/useSession';

export default function Home() {
  const session = useSession();

  if (!session) {
    return <Loading />;
  }

  return (
    <main className="flex-1 flex justify-center items-center">
      <div className="flex flex-col items-center w-full p-2">
        <ItemForm />
      </div>
    </main>
  );
}
