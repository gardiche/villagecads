import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - données considérées fraîches
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});
