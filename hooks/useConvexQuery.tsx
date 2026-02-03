import { useMutation, useQuery } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook to handle Convex queries with loading and error states.
 *
 * @template TData - Expected return type of the query
 * @template TArgs - Arguments type passed to the query function
 *
 * @param query - Convex query function reference
 * @param args - Arguments to be passed to the query
 *
 * @returns An object containing:
 * - `data`: The resolved query data
 * - `isLoading`: Whether the query is currently loading
 * - `error`: Error message if the query fails
 */
export const useConvexQuery = <
    TData = any,
    TArgs extends Record<string, any> | undefined = undefined,
>(
    query: FunctionReference<'query'>,
    args?: TArgs
) => {
    const result = useQuery(query, args);

    const [data, setData] = useState<TData | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (result === undefined) {
            setIsLoading(true);
            return;
        }

        try {
            setData(result);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong!';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [result]);

    return {
        data,
        isLoading,
        error,
    };
};

/**
 * Custom hook to handle Convex mutations with loading and error states.
 *
 * @template T - Expected return type of the mutation
 *
 * @param mutation - Convex mutation function reference
 *
 * @returns An object containing:
 * - `mutate`: Function to execute the mutation
 * - `data`: The resolved mutation response
 * - `isLoading`: Whether the mutation is currently in progress
 * - `error`: Error message if the mutation fails
 */
export const useConvexMutation = <T,>(mutation: FunctionReference<'mutation'>) => {
    const mutationFn = useMutation(mutation);

    const [data, setData] = useState<T | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Executes the mutation with the provided arguments.
     *
     * @param args - Arguments to pass to the mutation function
     *
     * @returns The mutation response
     */
    const mutate = async (args: any) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await mutationFn(args);
            setData(response);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong!';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { mutate, data, isLoading, error };
};
