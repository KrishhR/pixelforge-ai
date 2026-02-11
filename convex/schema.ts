import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        tokenIdentifier: v.string(),
        imageUrl: v.optional(v.string()),

        plan: v.union(v.literal('free_user'), v.literal('pro_user')),

        // Usage tracking for plan limits
        projectUsed: v.number(), // current project count
        exportsThisMonth: v.number(), // monthly export limit tracking

        createdAt: v.number(),
        lastActiveAt: v.number(),
    })
        .index('by_token', ['tokenIdentifier'])
        .index('by_email', ['email'])
        .searchIndex('search_name', { searchField: 'name' }) // user Search
        .searchIndex('search_email', { searchField: 'email' }),

    projects: defineTable({
        // basic project info
        title: v.string(),
        userId: v.id('users'),

        // canvas dimenstions and state
        canvasState: v.any(), // FabricJS canvas JSON (objects, layers, etc)
        width: v.number(), // canvas width in pixels
        height: v.number(), // canvas height in pixels

        // Image pipeline - tracks image transformations
        originalImageUrl: v.optional(v.string()), // initial upload image
        currentImageUrl: v.optional(v.string()), // current processed image
        thumbnailUrl: v.optional(v.string()), // small preview for dashboard

        // ImageKit transformation state
        activeTransformations: v.optional(v.string()), // current imageKit Url params

        // AI feature state => tracks what AI processing has been applied
        isBackgroundRemoved: v.optional(v.boolean()), // has background been removed

        // Organizations
        folderId: v.optional(v.id('folders')), // Optional folder organizations

        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(), // Last edit time
    })
        .index('by_user', ['userId'])
        .index('by_user_updated', ['userId', 'updatedAt'])
        .index('by_folder', ['folderId']), // Projects in folder

    folders: defineTable({
        name: v.string(), // folder's name
        nameLower: v.string(),
        userId: v.id('users'), // Owner
        createdAt: v.number(),
    })
        .index('by_user', ['userId']) // User's folder
        .index('by_user_name', ['userId', 'nameLower']),
});

/**
    PLAN LIMIT EXAMPLE:
    - Free: 3 projects, 20 exports/month, basic features only
    - Pro: Unlimited projects/exports, all AI-features
 */
