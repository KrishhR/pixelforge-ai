import { useMutation, useQuery } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useConvexQuery = <
    TData = unknown,
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

export const useConvexMutation = <T,>(mutation: FunctionReference<'mutation'>) => {
    const mutationFn = useMutation(mutation);

    const [data, setData] = useState<T | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
