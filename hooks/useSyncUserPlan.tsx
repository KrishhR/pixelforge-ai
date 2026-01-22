import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from './useConvexQuery';
import { usePlanAccess, UserPlanType } from './usePlanAccess';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook that synchronizes the user's subscription plan
 * between Clerk (auth provider) and Convex (database).
 *
 * This hook:
 * - Reads the current plan from Clerk entitlements
 * - Fetches the stored plan from Convex
 * - Updates Convex if the plans are out of sync
 *
 * Intended to run automatically after authentication.
 *
 * @returns An object indicating successful plan synchronization
 */
function useSyncUserPlan() {
    const { isFree, isPro } = usePlanAccess();
    // Fetches the current user record from Convex.
    const { data: currentUser } = useConvexQuery(api.users.getCurrentUser) as {
        data: { plan: UserPlanType } | null;
    };
    // Mutation to update the user's plan in Convex.
    const { mutate: updateUserPlan } = useConvexMutation(api.users.updateUserPlan);

    // Determines the current plan based on Clerk entitlements.
    const currentPlan = useMemo<UserPlanType | undefined>(() => {
        if (isFree) return 'free_user';
        if (isPro) return 'pro_user';
        return undefined;
    }, [isFree, isPro]);

    useEffect(() => {
        if (!currentPlan) return;
        if (currentUser?.plan === currentPlan) return;

        (async () => {
            try {
                await updateUserPlan({ plan: currentPlan });
            } catch (err) {
                console.error('Error occurred during plan update', err);
                toast.error('Error while updating current plan');
            }
        })();
    }, [currentPlan]);

    return { message: 'Plan synced successfully' };
}

export default useSyncUserPlan;
