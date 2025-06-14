'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  name: z.string({ message: 'name is required.' }),
  email: z.string().email({ message: 'email is required.' }),
  password: z.string({ message: 'password is required.' }),
});

export function SignUpForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit({
    name,
    email,
    password,
  }: z.infer<typeof formSchema>) {
    await authClient.signUp.email(
      {
        name,
        email,
        password,
        callbackURL: '/',
      },
      {
        onError: ({ error }) => {
          console.warn(error);
          toast.error(`sign up failed - ${error.message}`);
        },
        onSuccess: () => {
          router.push('/');
        },
      },
    );
  }

  return (
    <>
      <h2 className="pb-8 text-2xl text-center">sign up</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-sm max-w-full space-y-8"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>name</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <Button type="submit">sign up</Button>
        </form>
      </Form>
      <p className="py-8 text-center">
        already here?{' '}
        <Link href="/signin" className="text-blue-600 hover:underline">
          sign in
        </Link>
      </p>
    </>
  );
}
