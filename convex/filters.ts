import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const filtersValidator = v.object({
  minVolume: v.optional(v.number()),
  maxVolume: v.optional(v.number()),
  minOpenInterest: v.optional(v.number()),
  maxIV: v.optional(v.number()),
  minIV: v.optional(v.number()),
  maxDaysToExpiry: v.optional(v.number()),
  minProbabilityOfProfit: v.optional(v.number()),
  tickerFilter: v.optional(v.string()),
});

// Get user's saved filters
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("savedFilters")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
  },
});

// Save a filter preset
export const save = mutation({
  args: {
    name: v.string(),
    filters: filtersValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("savedFilters", {
      userId,
      name: args.name,
      filters: args.filters,
      createdAt: Date.now(),
    });
  },
});

// Delete a saved filter
export const remove = mutation({
  args: { id: v.id("savedFilters") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const filter = await ctx.db.get(args.id);
    if (!filter || filter.userId !== userId) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.id);
    return { removed: true };
  },
});
