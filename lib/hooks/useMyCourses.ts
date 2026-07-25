'use client';

import useSWR from 'swr';
import { fetcher, SWR_DEFAULTS } from '@/lib/swr-fetcher';
import { MyCourse } from '@/lib/store';

interface MyCoursesResponse {
  myCourses: MyCourse[];
}

export function useMyCourses() {
  const swr = useSWR<MyCoursesResponse>('/api/dashboard/my-courses', fetcher, SWR_DEFAULTS);

  return {
    myCourses: (swr.data?.myCourses ?? []) as MyCourse[],
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
    refresh: swr.mutate,
  };
}
