import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from './useConvexQuery';
import { usePlanAccess, UserPlanType } from './usePlanAccess';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

function useSyncUserPlan() {
    const { isFree, isPro } = usePlanAccess();
    const { data: currentUser } = useConvexQuery(api.users.getCurrentUser) as {
        data: { plan: UserPlanType } | null;
    };
    const { mutate: updateUserPlan } = useConvexMutation(api.users.updateUserPlan);

    // current plan comes from clerk's current plan
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
                console.error('Error occured in plan updation', err);
                toast.error('Error while updating current plan');
            }
        })();
    }, [currentPlan]);

    return { message: 'Plan sync successfully' };
}

export default useSyncUserPlan;
