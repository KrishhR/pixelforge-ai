import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { api } from './_generated/api';
import { Id, Doc } from './_generated/dataModel';

export const create = mutation({
    args: {
        title: v.string(),
        originalImageUrl: v.optional(v.string()),
        currentImageUrl: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        canvasState: v.optional(v.any()),
        width: v.number(),
        height: v.number(),
    },
    handler: async (ctx, args) => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);

        if (user.plan === 'free') {
            const projectCount = await ctx.db
                .query('projects')
                .withIndex('by_user', (q) => q.eq('userId', user._id))
                .collect();

            if (projectCount.length >= 3) {
                throw new Error(
                    'Free plan limited to 3 projects. Upgrade to pro for unlimited projects'
                );
            }
        }
        // Create the project
        const projectId: Id<'projects'> = await ctx.db.insert('projects', {
            title: args.title,
            userId: user._id,
            canvasState: args.canvasState,
            width: args.width,
            height: args.height,
            originalImageUrl: args.originalImageUrl,
            currentImageUrl: args.currentImageUrl,
            thumbnailUrl: args.thumbnailUrl,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Update user's project count
        await ctx.db.patch(user._id, {
            projectUsed: user.projectUsed + 1,
            lastActiveAt: Date.now(),
        });

        return projectId;
    },
});

export const getUserProjects = query({
    handler: async (ctx): Promise<Doc<'projects'>[]> => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);

        if (!user) {
            throw new Error('User not found');
        }

        const projects: Doc<'projects'>[] = await ctx.db
            .query('projects')
            .withIndex('by_user_updated', (q) => q.eq('userId', user._id))
            .order('desc')
            .collect();

        return projects;
    },
});

export const deleteProject = mutation({
    args: {
        projectId: v.id('projects'),
    },
    handler: async (ctx, args) => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);

        const project = await ctx.db.get(args.projectId);
        if (!project) {
            throw new Error('Project does not exist.');
        }

        if (!user || project.userId !== user._id) {
            throw new Error('Access Denied');
        }

        await ctx.db.delete(args.projectId);

        await ctx.db.patch(user._id, {
            projectUsed: Math.max(0, user.projectUsed - 1),
            lastActiveAt: Date.now(),
        });

        return { success: true };
    },
});

export const getProject = query({
    args: {
        projectId: v.id('projects'),
    },
    handler: async (ctx, args) => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);

        const project = await ctx.db.get(args.projectId);
        if (!project) {
            throw new Error('Project does not exist.');
        }

        if (!user || project.userId !== user._id) {
            throw new Error('Access Denied');
        }

        return project;
    },
});

export const updateProject = mutation({
    args: {
        projectId: v.id('projects'),
        canvasState: v.optional(v.any()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        currentImageUrl: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        activeTransformations: v.optional(v.string()),
        backgroundRemoved: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);

        const project = await ctx.db.get(args.projectId);
        if (!project) {
            throw new Error('Project does not exist.');
        }

        const updatedData: { [key: string]: any } = {
            updatedAt: Date.now(),
        };

        if (args.canvasState !== undefined) updatedData['canvasState'] = args.canvasState;

        if (args.width !== undefined) updatedData['width'] = args.width;

        if (args.height !== undefined) updatedData['height'] = args.height;

        if (args.currentImageUrl !== undefined)
            updatedData['currentImageUrl'] = args.currentImageUrl;

        if (args.thumbnailUrl !== undefined) updatedData['thumbnailUrl'] = args.thumbnailUrl;

        if (args.activeTransformations !== undefined)
            updatedData['activeTransformations'] = args.activeTransformations;

        if (args.backgroundRemoved !== undefined)
            updatedData['backgroundRemoved'] = args.backgroundRemoved;

        await ctx.db.patch(args.projectId, updatedData);

        return args.projectId;
    },
});
