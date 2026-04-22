import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's watchlist
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("watchlist")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
  },
});

// Add ticker to watchlist
export const add = mutation({
  args: { ticker: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already in watchlist
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    if (existing.some(w => w.ticker === args.ticker)) {
      return { added: false, message: "Already in watchlist" };
    }

    await ctx.db.insert("watchlist", {
      userId,
      ticker: args.ticker.toUpperCase(),
      addedAt: Date.now(),
    });

    return { added: true };
  },
});

// Remove ticker from watchlist
export const remove = mutation({
  args: { id: v.id("watchlist") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== userId) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.id);
    return { removed: true };
  },
});
