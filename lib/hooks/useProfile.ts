import useSWR from 'swr';
import { fetcher, SWR_DEFAULTS } from '@/lib/swr-fetcher';

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR('/api/profile', fetcher, SWR_DEFAULTS);

  return {
    profile: data ?? null,
    isLoading,
    error: error as Error | undefined,
    refresh: mutate,
  };
}
