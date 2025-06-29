import { Suspense } from 'react';
import { SignInForm } from '@/components/SignInForm';

export default function SignIn() {
  return (
    <main className="flex-1 flex justify-center items-center">
      <div className="flex flex-col items-center w-full p-2">
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
