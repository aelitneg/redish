'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Spinner } from './ui/spinner';
import { Button } from './ui/button';
import { Form } from './ui/form';

interface Client {
  id: string;
  name: string;
}

const formSchema = z.object({});

export function ConsentForm() {
  const [client, setClient] = useState<Client>();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    (async () => {
      const clientId = searchParams.get('clientId');

      if (!clientId) {
        return router.push('/');
      }

      const client = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/oauth/clients/${clientId}`,
      ).then<Client>((res) => res.json());

      setClient(client);
    })();
  }, [searchParams, router]);

  async function onSubmit(consent = false) {
    const clientId = searchParams.get('clientId');
    const state = searchParams.get('state');

    if (!clientId) {
      toast.error('Missing client ID');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/oauth/authorize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            clientId,
            consent,
            state,
          }),
        },
      );

      if (response.ok) {
        await response.json();
        toast.success(
          consent ? 'Authorization granted' : 'Authorization denied',
        );
      } else {
        const { error } = await response.json();
        throw Error(`Request failed: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to process authorization request');
    } finally {
      setIsLoading(false);
      setIsCompleted(true);
    }
  }

  if (!client) {
    return <Spinner />;
  }

  return (
    <div className="text-center">
      <h2 className="pb-4 text-2xl">Authorize App</h2>
      <h3 className="pb-4 text-xl">{client?.name}</h3>

      <p className="pb-8 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        <strong>{client?.name}</strong> is requesting permission to access your
        account. By clicking Allow, you authorize this application to access
        your data.
      </p>

      <Form {...form}>
        {isCompleted ? (
          <div className="max-w-md mx-auto">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Return to <strong>{client?.name}</strong> to continue
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-4 sm:flex sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSubmit(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Deny
            </Button>
            <Button
              type="button"
              onClick={() => onSubmit(true)}
              disabled={isLoading}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              Allow
            </Button>
          </div>
        )}
      </Form>
    </div>
  );
}
