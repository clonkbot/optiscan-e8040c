import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Watchlist for users to track specific tickers
  watchlist: defineTable({
    userId: v.id("users"),
    ticker: v.string(),
    addedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Saved scans/filters
  savedFilters: defineTable({
    userId: v.id("users"),
    name: v.string(),
    filters: v.object({
      minVolume: v.optional(v.number()),
      maxVolume: v.optional(v.number()),
      minOpenInterest: v.optional(v.number()),
      maxIV: v.optional(v.number()),
      minIV: v.optional(v.number()),
      maxDaysToExpiry: v.optional(v.number()),
      minProbabilityOfProfit: v.optional(v.number()),
      tickerFilter: v.optional(v.string()),
    }),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Cached options data (simulated real-time data)
  optionsData: defineTable({
    ticker: v.string(),
    optionType: v.string(), // "call" or "put"
    strikePrice: v.number(),
    expirationDate: v.string(),
    sharePrice: v.number(),
    optionPrice: v.number(),
    bid: v.number(),
    ask: v.number(),
    volume: v.number(),
    openInterest: v.number(),
    impliedVolatility: v.number(),
    delta: v.number(),
    gamma: v.number(),
    theta: v.number(),
    vega: v.number(),
    probabilityOfProfit: v.number(),
    rsiValue: v.number(),
    isOversold: v.boolean(),
    lastUpdated: v.number(),
  })
    .index("by_ticker", ["ticker"])
    .index("by_oversold", ["isOversold"])
    .index("by_expiration", ["expirationDate"]),
});
