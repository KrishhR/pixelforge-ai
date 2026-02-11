import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';
import { api } from './_generated/api';

export const createFolder = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args): Promise<Id<'folders'>> => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);
        if (!user) {
            throw new Error('User not found');
        }

        const name = args.name.trim();
        if (!name) {
            throw new Error('Folder name cannot be empty');
        }

        const nameLower = name.toLowerCase();

        // Prevent duplicate folder names per user
        const existingFolder = await ctx.db
            .query('folders')
            .withIndex('by_user_name', (q) => q.eq('userId', user._id).eq('nameLower', nameLower))
            .first();

        if (existingFolder) {
            throw new Error('Folder with this name already exists');
        }

        const folderId: Id<'folders'> = await ctx.db.insert('folders', {
            name: args.name,
            nameLower,
            userId: user._id,
            createdAt: Date.now(),
        });

        return folderId;
    },
});

export const getUserFolders = query({
    handler: async (ctx): Promise<Doc<'folders'>[]> => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);
        if (!user) {
            throw new Error('User not found');
        }

        const folders: Doc<'folders'>[] = await ctx.db
            .query('folders')
            .withIndex('by_user', (q) => q.eq('userId', user._id))
            .order('desc')
            .collect();

        return folders;
    },
});

export const renameFolder = mutation({
    args: {
        folderId: v.id('folders'),
        newName: v.string(),
    },
    handler: async (ctx, { folderId, newName }) => {
        // Get current user
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);
        if (!user) {
            throw new Error('User not found');
        }

        // Fetch the folder
        const folder: Doc<'folders'> | null = await ctx.db.get(folderId);
        if (!folder || folder.userId !== user._id) {
            throw new Error('Folder does not exist or does not belong to you');
        }

        const name = newName.trim();
        if (!name) {
            throw new Error('Folder name cannot be empty');
        }

        const nameLower = name.toLowerCase();

        // Prevent renaming to an existing folder name
        const existingFolder = await ctx.db
            .query('folders')
            .withIndex('by_user_name', (q) => q.eq('userId', user._id).eq('nameLower', nameLower))
            .first();

        if (existingFolder && existingFolder._id !== folderId) {
            throw new Error('Folder with this name already exists');
        }

        // Update folder name
        await ctx.db.patch(folderId, { name, nameLower });
    },
});

export const deleteFolder = mutation({
    args: {
        folderId: v.id('folders'),
    },
    handler: async (ctx, args): Promise<{ success: boolean }> => {
        const user: Doc<'users'> | null = await ctx.runQuery(api.users.getCurrentUser);
        if (!user) {
            throw new Error('User not found');
        }

        const folder = await ctx.db.get(args.folderId);
        if (!folder || folder?.userId !== user._id) {
            throw new Error('Access Denied');
        }

        // Remove folder reference from projects
        const projects = await ctx.db
            .query('projects')
            .withIndex('by_folder', (q) => q.eq('folderId', args.folderId))
            .collect();

        await Promise.all(
            projects.map((project) =>
                ctx.db.patch(project._id, {
                    folderId: undefined,
                    updatedAt: Date.now(),
                })
            )
        );

        await ctx.db.delete(args.folderId);

        return { success: true };
    },
});
