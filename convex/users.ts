import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Called storeUser without authentication present');
        }

        // Check if we've already stored this identity before.
        // Note: If you don't want to define an index right away, you can use
        // ctx.db.query("users")
        //  .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
        //  .unique();
        const user = await ctx.db
            .query('users')
            .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
            .unique();
        if (user !== null) {
            // If we've seen this identity before but the name has changed, patch the value.
            if (user.name !== identity.name) {
                await ctx.db.patch(user._id, { name: identity.name });
            }
            return user._id;
        }
        // If it's a new identity, create a new `User`.
        return await ctx.db.insert('users', {
            name: identity.name ?? 'Anonymous',
            tokenIdentifier: identity.tokenIdentifier,
            email: identity.email ?? '',
            imageUrl: identity.pictureUrl,
            plan: 'free_user', // Default
            projectUsed: 0, // Initialize Usage count
            exportsThisMonth: 0,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
        });
    },
});

export const getCurrentUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Not authenticated!');
        }

        const user = await ctx.db
            .query('users')
            .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
            .unique();

        if (!user) {
            throw new Error('User not found!');
        }

        return user;
    },
});

export const updateUserPlan = mutation({
    args: {
        plan: v.union(v.literal('free_user'), v.literal('pro_user')),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Called updateUserPlan without authentication present');
        }

        const user = await ctx.db
            .query('users')
            .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
            .unique();

        if (!user) {
            throw new Error('User not found');
        }

        if (user.plan !== args.plan) {
            await ctx.db.patch(user._id, {
                plan: args.plan,
                lastActiveAt: Date.now(),
            });
        }

        return user._id;
    },
});

export const updateUser = mutation({
    args: {
        updates: v.object({
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            imageUrl: v.optional(v.string()),
            projectUsed: v.optional(v.number()),
            exportsThisMonth: v.optional(v.number()),
            lastActiveAt: v.optional(v.number()),
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Called updateUser without authentication present');
        }

        const user = await ctx.db
            .query('users')
            .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
            .unique();

        if (!user) {
            throw new Error('User not found');
        }

        // Always update lastActiveAt unless explicitly overridden
        const updates = {
            ...args.updates,
            lastActiveAt: args.updates.lastActiveAt ?? Date.now(),
        };

        await ctx.db.patch(user._id, updates);

        return user._id;
    },
});
