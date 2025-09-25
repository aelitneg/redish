'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ChevronDownIcon } from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { useQueryStringFilter } from '../hooks/useQueryStringFilter';

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
  const originalUrlRef = useRef<string>('');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const { isFilterEnabled, toggleFilter, filterUrl } = useQueryStringFilter();

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

  // Watch for changes to link field
  const linkField = form.watch('link');

  // Handle form changes
  useEffect(() => {
    if (!linkField) return;

    // If this is a new URL, save as original and filter if needed
    if (linkField !== originalUrlRef.current) {
      originalUrlRef.current = linkField;

      if (isFilterEnabled) {
        const filtered = filterUrl(linkField);
        if (filtered !== linkField) {
          form.setValue('link', filtered);
        }
      }
    }
  }, [linkField, isFilterEnabled, filterUrl, form]);

  // Handle filter toggle changes
  useEffect(() => {
    if (!originalUrlRef.current) return;

    const currentValue = form.getValues('link');
    if (isFilterEnabled) {
      const filtered = filterUrl(originalUrlRef.current);
      if (filtered !== currentValue) {
        form.setValue('link', filtered);
      }
    } else {
      if (originalUrlRef.current !== currentValue) {
        form.setValue('link', originalUrlRef.current);
      }
    }
  }, [isFilterEnabled, filterUrl, form]);

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
        form.reset();
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

        {/* Options Collapsible */}
        <div className="flex flex-col items-center space-y-2">
          <Collapsible open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                Options
                <ChevronDownIcon
                  className={`ml-1 h-4 w-4 transition-transform ${isOptionsOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="flex items-center space-x-2 px-4 py-2 border border-border rounded-md bg-muted/50">
                <input
                  id="filter-query-string"
                  type="checkbox"
                  checked={isFilterEnabled}
                  onChange={toggleFilter}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2"
                  aria-describedby="filter-query-string-description"
                />
                <label
                  htmlFor="filter-query-string"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Filter Query String
                </label>
                <span id="filter-query-string-description" className="sr-only">
                  Remove tracking parameters from URLs when pasting
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <Button type="submit">{labels.buttonText}</Button>
      </form>
    </Form>
  );
}
