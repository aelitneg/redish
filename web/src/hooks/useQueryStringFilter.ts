import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'redish-filter-query-string';

interface FilterOptions {
  preserve?: string[];
}

export function useQueryStringFilter() {
  const [isFilterEnabled, setIsFilterEnabled] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsFilterEnabled(JSON.parse(stored));
      }
    } catch (error) {
      console.warn(
        'Failed to load filter preference from localStorage:',
        error,
      );
      // Default to true if localStorage fails
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isFilterEnabled));
    } catch (error) {
      console.warn('Failed to save filter preference to localStorage:', error);
    }
  }, [isFilterEnabled]);

  const filterUrl = useCallback(
    (url: string, options: FilterOptions = {}) => {
      if (!isFilterEnabled) return url;

      try {
        let urlToParse = url.trim();

        // Add a temporary protocol for parsing if URL one is not present
        if (
          !urlToParse.startsWith('http://') &&
          !urlToParse.startsWith('https://')
        ) {
          urlToParse = `https://${urlToParse}`;
        }

        const urlObj = new URL(urlToParse);

        // Clear all search params
        if (options.preserve && options.preserve.length > 0) {
          const paramsToKeep = new URLSearchParams();
          options.preserve.forEach((param) => {
            const value = urlObj.searchParams.get(param);
            if (value !== null) {
              paramsToKeep.set(param, value);
            }
          });
          urlObj.search = paramsToKeep.toString();
        } else {
          urlObj.search = '';
        }

        // Remove the temporary protocol if one was added
        const result = urlObj.toString();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return result.replace(/^https?:\/\//, '');
        }

        return result;
      } catch (error) {
        // If URL parsing fails, return original URL
        console.warn('Failed to parse URL for filtering:', error);
        return url;
      }
    },
    [isFilterEnabled],
  );

  const toggleFilter = useCallback(() => {
    setIsFilterEnabled((prev) => !prev);
  }, []);

  return {
    isFilterEnabled,
    toggleFilter,
    filterUrl,
  };
}
