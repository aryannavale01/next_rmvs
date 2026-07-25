export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch');
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};

export const SWR_DEFAULTS = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 25000,
  dedupingInterval: 5000,
  errorRetryCount: 3,
} as const;
