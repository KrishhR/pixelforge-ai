import { useUser } from '@clerk/nextjs';
import { useConvexAuth } from 'convex/react';
import { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

/**
 * Custom hook that ensures the authenticated Clerk user
 * is persisted in the Convex `users` table.
 *
 * This hook:
 * - Waits for authentication via Convex + Clerk
 * - Stores the user record on the server if authenticated
 * - Tracks when the user has been successfully stored
 *
 * Useful for syncing auth state with backend user records.
 *
 * @returns Authentication and loading state derived from
 * both Convex auth and local persistence state.
 */
export function useStoreUserEffect() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const { user } = useUser();
    // Indicates whether the user has been successfully stored in the Convex `users` table.
    const [userId, setUserId] = useState<Id<'users'> | null>(null);
    const storeUser = useMutation(api.users.store);
    // Call the `storeUser` mutation function to store the current user in the `users` table and return the `Id` value.
    useEffect(() => {
        // Do nothing if the user is not authenticated
        if (!isAuthenticated) {
            return;
        }
        // Store the user in the database.
        // Recall that `storeUser` gets the user information via the `auth`
        // object on the server. You don't need to pass anything manually here.
        async function createUser() {
            const id = await storeUser();
            setUserId(id);
        }
        createUser();
        // Reset local state on cleanup or identity change
        return () => setUserId(null);

        // Re-run if authentication state or user identity changes
    }, [isAuthenticated, storeUser, user?.id]);

    // Combine Convex auth state with local persistence state
    // to derive accurate loading and authentication status.
    return {
        isLoading: isLoading || (isAuthenticated && userId === null),
        isAuthenticated: isAuthenticated && userId !== null,
    };
}
