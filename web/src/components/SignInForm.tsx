'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Button } from './ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';

const formSchema = z.object({
  email: z.string().email({ message: 'email is required.' }),
  password: z.string({ message: 'password is required.' }),
});

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit({ email, password }: z.infer<typeof formSchema>) {
    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onError: ({ error }) => {
          console.warn(error);
          toast.error(`sign in failed - ${error.message}`);
        },
        onSuccess: () => {
          const redirect = searchParams.get('redirect');
          const redirectPath = redirect ? decodeURIComponent(redirect) : '/';
          router.push(redirectPath);
        },
      },
    );
  }

  return (
    <>
      <h2 className="pb-8 text-2xl text-center">sign in</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-sm max-w-full space-y-8"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">sign in</Button>
        </form>
      </Form>
      <p className="py-8 text-center">
        new here?{' '}
        <Link href="/signup" className="text-blue-600 hover:underline">
          sign up
        </Link>
      </p>
    </>
  );
}
