import { Spinner } from './ui/spinner';

export function Loading() {
  return (
    <main className="flex-1 flex justify-center items-center">
      <div className="flex flex-col items-center w-full p-2">
        <Spinner />
      </div>
    </main>
  );
}
