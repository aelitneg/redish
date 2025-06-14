import { SignUpForm } from '@/components/SignUpForm';

export default function SignUp() {
  return (
    <main className="flex-1 flex justify-center items-center">
      <div className="flex flex-col items-center w-full p-2">
        <SignUpForm />
      </div>
    </main>
  );
}
