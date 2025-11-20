import { useState, useCallback } from 'react';
import { ApiException } from '../types/api.types';
import ErrorHandler from '../utils/errorHandler';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiException | null;
}

interface UseApiReturn<T, Args extends unknown[]> extends UseApiState<T> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T, Args extends unknown[]>(
  apiFunction: (...args: Args) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiException) => void;
    showErrorToast?: boolean;
  }
): UseApiReturn<T, Args> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        const apiError = error instanceof ApiException 
          ? error 
          : new ApiException('An error occurred', 0);

        setState({ data: null, loading: false, error: apiError });

        if (options?.showErrorToast !== false) {
          ErrorHandler.handle(error);
        }

        if (options?.onError) {
          options.onError(apiError);
        }

        return null;
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specialized hook for data fetching
export function useFetch<T>(
  apiFunction: () => Promise<T>,
  options?: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiException) => void;
  }
): UseApiReturn<T, []> & { refetch: () => Promise<T | null> } {
  const api = useApi(apiFunction, options);

  const refetch = useCallback(() => {
    return api.execute();
  }, [api]);

  // Auto-fetch on mount if immediate is true
  useState(() => {
    if (options?.immediate !== false) {
      api.execute();
    }
  });

  return {
    ...api,
    refetch,
  };
}