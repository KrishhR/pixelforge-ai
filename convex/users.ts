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
            plan: 'free', // Default
            projectUsed: 0, // Initialize Usage count
            exportsThisMonth: 0,
            unlimitedProjects: false,
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

// This function can be used, when functionality for admin login will be added
export const setUnlimitedProjects = mutation({
    args: {
        userId: v.id('users'),
        value: v.boolean(),
    },
    handler: async (ctx, args) => {
        // NOTE: protect this in production (only allow from admin/admin token)
        await ctx.db.patch(args.userId, {
            unlimitedProjects: args.value,
            lastActiveAt: Date.now(),
        });
        return { success: true };
    },
});
