import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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

const LINK_LABELS = [
  'Paste a URL you solemnly swear to revisit.',
  "Drop a link you'll definitely read later.",
  'Save it. Forget it. Repeat.',
  "Enter link to pretend you'll come back to it.",
  'What are you totally going to read this time?',
  'One more for the pile.',
];

const BUTTON_TEXTS = [
  'Read Me later',
  'Into the Void',
  'RIP This Link',
  'Another One...',
  'Join the Others',
  'To the Heap',
];

type Labels = {
  linkLabel: string;
  buttonText: string;
};

function getRandomLabels(): Labels {
  return {
    linkLabel: LINK_LABELS[Math.floor(Math.random() * LINK_LABELS.length)],
    buttonText: BUTTON_TEXTS[Math.floor(Math.random() * BUTTON_TEXTS.length)],
  };
}

const formSchema = z.object({
  link: z.string().url({ message: 'Link must be a valid URL.' }),
});

export function ItemForm() {
  const [feedId, setFeedId] = useState<string>();
  const [labels, setLabels] = useState<Labels>({
    linkLabel: '',
    buttonText: '',
  });

  useEffect(() => {
    setLabels(getRandomLabels());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const feeds = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feeds`, {
          method: 'GET',
          credentials: 'include',
        }).then((res) => res.json());

        setFeedId(feeds[0].id);
      } catch (error) {
        console.error(error);
        toast.error('Unable to fetch feed ID');
      }
    })();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      link: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const params = new URLSearchParams({ link: values.link });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/feeds/${feedId}/items?${params}`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (response.ok) {
        toast.success('Link added to feed');
        setLabels(getRandomLabels());
      } else {
        const { error } = await response.json();
        throw Error(`Request failed: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to save link to feed');
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-xl max-w-full text-center space-y-8"
      >
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-center text-2xl">
                {labels.linkLabel}
              </FormLabel>
              <FormControl>
                <Input type="url" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{labels.buttonText}</Button>
      </form>
    </Form>
  );
}
