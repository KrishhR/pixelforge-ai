import { useAuth } from '@clerk/nextjs';

/**
 * All available editor tool identifiers.
 */
export type ToolIdTypes =
    | 'resize'
    | 'crop'
    | 'adjust'
    | 'text'
    | 'background'
    | 'ai_extender'
    | 'ai_edit';

/**
 * Supported user subscription plans.
 */
export type UserPlanType = 'free_user' | 'pro_user';

/**
 * Custom hook to determine feature access and limits
 * based on the authenticated user's subscription plan.
 *
 * Uses Clerk's `has` method to check entitlement-based access.
 *
 * @returns An object containing plan details, access helpers,
 * and usage limit checks.
 */
export const usePlanAccess = () => {
    const { has } = useAuth();

    /**
     * Whether the current user has a Pro subscription.
     */
    const isPro = has?.({ plan: 'pro_user' }) || false;

    /**
     * Whether the current user is on the Free plan.
     * Defaults to free if not Pro.
     */
    const isFree = !isPro;

    /**
     * Maps each tool to whether it is accessible
     * under the current user's plan.
     */
    const planAccess: Record<ToolIdTypes, boolean> = {
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

    /**
     * Checks whether the user has access to a specific tool.
     *
     * @param toolId - The tool identifier
     * @returns `true` if the tool is accessible, otherwise `false`
     */
    const hasAccess = (toolId: ToolIdTypes): boolean => {
        return planAccess[toolId];
    };

    /**
     * Returns a list of tools that are restricted
     * under the current user's plan.
     *
     * @returns Array of restricted tool IDs
     */
    const restrictedTools = (): ToolIdTypes[] => {
        return (Object.entries(planAccess) as [ToolIdTypes, boolean][])
            .filter(([, allowed]) => !allowed)
            .map(([toolId]) => toolId);
    };

    /**
     * Determines whether the user can create a new project
     * based on their plan and current project count.
     *
     * Free plan: max 3 projects
     * Pro plan: unlimited
     *
     * @param currentProjectCount - Number of existing projects
     * @returns Whether project creation is allowed
     */
    const canCreateProject = (currentProjectCount: number): boolean => {
        if (isPro) return true;
        return currentProjectCount < 3;
    };

    /**
     * Determines whether the user can export content
     * based on their plan and monthly export usage.
     *
     * Free plan: max 20 exports per month
     * Pro plan: unlimited
     *
     * @param currentExportThisMonth - Number of exports used this month
     * @returns Whether exporting is allowed
     */
    const canExport = (currentExportThisMonth: number): boolean => {
        if (isPro) return true;
        return currentExportThisMonth < 20;
    };

    return {
        userPlan: isPro ? 'pro' : ('free_user' as UserPlanType),
        isPro,
        isFree,
        planAccess,
        hasAccess,
        restrictedTools,
        canCreateProject,
        canExport,
    };
};
