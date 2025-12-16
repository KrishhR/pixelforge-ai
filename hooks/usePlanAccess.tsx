import { useAuth } from '@clerk/nextjs';

export type ToolId =
    | 'resize'
    | 'crop'
    | 'adjust'
    | 'text'
    | 'background'
    | 'ai_extender'
    | 'ai_edit';
export type UserPlan = 'free_user' | 'pro_user';

export const usePlanAccess = () => {
    const { has } = useAuth();

    const isPro = has?.({ plan: 'pro_user' }) || false;
    const isFree = !isPro; // If not pro, then free (default)

    const planAccess: Record<ToolId, boolean> = {
        // Free plan tools
        resize: true,
        crop: true,
        adjust: true,
        text: true,

        // Pro-only tools
        background: isPro,
        ai_extender: isPro,
        ai_edit: isPro,
    };

    /** Check access for a specific tool */
    const hasAccess = (toolId: ToolId): boolean => {
        return planAccess[toolId];
    };

    /** Get all restricted tools for current plan */
    const restrictedTools = (): ToolId[] => {
        return (Object.entries(planAccess) as [ToolId, boolean][])
            .filter(([, allowed]) => !allowed)
            .map(([toolId]) => toolId);
    };

    /** Project limits */
    const canCreateProject = (currentProjectCount: number): boolean => {
        if (isPro) return true;
        return currentProjectCount < 3;
    };

    /** Monthly export limits */
    const canExport = (CurrentExportThisMonth: number): boolean => {
        if (isPro) return true;
        return CurrentExportThisMonth < 20;
    };

    return {
        userPlan: isPro ? 'pro_user' : ('free_user' as UserPlan),
        isPro,
        isFree,
        planAccess,
        hasAccess,
        restrictedTools,
        canCreateProject,
        canExport,
    };
};
