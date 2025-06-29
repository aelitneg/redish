'use client';

import { Suspense } from 'react';
import { Loading } from '@/components/Loading';
import { useSession } from '@/hooks/useSession';
import { ConsentForm } from '@/components/ConsentForm';

export default function Consent() {
  const session = useSession();

  if (!session) {
    return <Loading />;
  }

  return (
    <main className="flex-1 flex justify-center items-center">
      <div className="flex flex-col items-center w-full p-2">
        <Suspense>
          <ConsentForm />
        </Suspense>
      </div>
    </main>
  );
}
