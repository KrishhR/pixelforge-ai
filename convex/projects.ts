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

        if (user.plan === 'free_user') {
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

        const project: Doc<'projects'> | null = await ctx.db.get(args.projectId);
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
        title: v.optional(v.string()),
        canvasState: v.optional(v.any()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        currentImageUrl: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        activeTransformations: v.optional(v.string()),
        isBackgroundRemoved: v.optional(v.boolean()),
        folderId: v.optional(v.id('folders')),
    },
    handler: async (ctx, args) => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);
        if (!user) throw new Error('User not found');

        const project: Doc<'projects'> | null = await ctx.db.get(args.projectId);
        if (!project || project.userId !== user._id) {
            throw new Error('Project not found or access denied');
        }

        const updatedData: Record<string, any> = {
            updatedAt: Date.now(),
        };

        for (const key of [
            'title',
            'canvasState',
            'width',
            'height',
            'currentImageUrl',
            'thumbnailUrl',
            'activeTransformations',
            'isBackgroundRemoved',
        ]) {
            if (args[key as keyof typeof args] !== undefined) {
                updatedData[key] = args[key as keyof typeof args];
            }
        }

        if (args.folderId !== undefined) {
            const folder: Doc<'folders'> | null = await ctx.db.get(args.folderId);

            if (!folder || folder.userId !== user._id) {
                throw new Error('Folder not found or access denied');
            }

            updatedData['folderId'] = args.folderId;
        }

        await ctx.db.patch(args.projectId, updatedData);
        return args.projectId;
    },
});

export const removeProjectFromFolder = mutation({
    args: {
        projectId: v.id('projects'),
    },
    handler: async (ctx, { projectId }) => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);
        if (!user) throw new Error('User not found');

        const project: Doc<'projects'> | null = await ctx.db.get(projectId);
        if (!project || project.userId !== user._id) {
            throw new Error('Project not found or access denied');
        }
        await ctx.db.patch(projectId, { folderId: undefined, updatedAt: Date.now() });
    },
});

export const getProjectsInFolder = query({
    args: {
        folderId: v.id('folders'),
    },
    handler: async (ctx, args) => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);
        if (!user) throw new Error('User not found');

        const folder: Doc<'folders'> | null = await ctx.db.get(args.folderId);
        if (!folder || folder.userId !== user._id) {
            throw new Error('Folder not found or access denied');
        }
        const projects: Doc<'projects'>[] | null = await ctx.db
            .query('projects')
            .withIndex('by_folder', (q) => q.eq('folderId', args.folderId))
            .order('desc')
            .collect();
        return projects;
    },
});
