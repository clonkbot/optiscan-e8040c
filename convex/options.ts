import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Popular Robinhood stocks and ETFs
const TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "AMD", "INTC", "NFLX",
  "SPY", "QQQ", "IWM", "DIA", "VTI", "VOO", "ARKK", "XLF", "XLE", "GLD",
  "PLTR", "SOFI", "NIO", "RIVN", "LCID", "F", "GM", "BAC", "JPM", "C",
  "COIN", "HOOD", "SNAP", "UBER", "LYFT", "ABNB", "RBLX", "DKNG", "PENN", "MGM"
];

// Generate realistic option data
function generateOptionData(ticker: string, now: number) {
  const basePrice = 50 + Math.random() * 450;
  const options = [];

  // Generate multiple expiration dates
  const expirations = [7, 14, 21, 30, 45, 60].map(days => {
    const date = new Date(now + days * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  });

  for (const expDate of expirations) {
    // Generate multiple strike prices around current price
    const strikes = [];
    for (let i = -5; i <= 5; i++) {
      strikes.push(Math.round((basePrice * (1 + i * 0.05)) * 100) / 100);
    }

    for (const strike of strikes) {
      const daysToExpiry = Math.ceil((new Date(expDate).getTime() - now) / (1000 * 60 * 60 * 24));
      const moneyness = (basePrice - strike) / basePrice;

      // IV tends to be higher for OTM options and shorter expiry
      const baseIV = 0.25 + Math.random() * 0.5;
      const iv = baseIV * (1 + Math.abs(moneyness) * 0.5) * (1 + (30 - daysToExpiry) / 100);

      // RSI for determining oversold (below 30 is oversold)
      const rsi = 15 + Math.random() * 70;
      const isOversold = rsi < 30;

      // Option pricing (simplified Black-Scholes approximation)
      const timeValue = Math.sqrt(daysToExpiry / 365) * basePrice * iv;
      const intrinsicValue = Math.max(0, basePrice - strike);
      const optionPrice = Math.max(0.01, intrinsicValue + timeValue * (0.3 + Math.random() * 0.4));

      // Greeks
      const delta = moneyness > 0 ? 0.5 + moneyness * 2 : 0.5 + moneyness;
      const gamma = Math.exp(-moneyness * moneyness * 2) * 0.1;
      const theta = -optionPrice * 0.02 * (1 + (30 - daysToExpiry) / 30);
      const vega = basePrice * Math.sqrt(daysToExpiry / 365) * 0.01;

      // Volume and open interest
      const volume = Math.floor(Math.random() * 50000) + 100;
      const openInterest = Math.floor(Math.random() * 100000) + 500;

      // Probability of profit (simplified)
      const pop = Math.max(5, Math.min(95, 50 + moneyness * 100 - iv * 30 + (isOversold ? 15 : 0)));

      const spread = optionPrice * (0.02 + Math.random() * 0.05);

      options.push({
        ticker,
        optionType: "call",
        strikePrice: strike,
        expirationDate: expDate,
        sharePrice: basePrice,
        optionPrice: Math.round(optionPrice * 100) / 100,
        bid: Math.round((optionPrice - spread / 2) * 100) / 100,
        ask: Math.round((optionPrice + spread / 2) * 100) / 100,
        volume,
        openInterest,
        impliedVolatility: Math.round(iv * 10000) / 100,
        delta: Math.round(Math.max(-1, Math.min(1, delta)) * 1000) / 1000,
        gamma: Math.round(gamma * 10000) / 10000,
        theta: Math.round(theta * 100) / 100,
        vega: Math.round(vega * 100) / 100,
        probabilityOfProfit: Math.round(pop * 10) / 10,
        rsiValue: Math.round(rsi * 10) / 10,
        isOversold,
        lastUpdated: now,
      });
    }
  }

  return options;
}

// Get all options with filters
export const getOptions = query({
  args: {
    tickerFilter: v.optional(v.string()),
    minVolume: v.optional(v.number()),
    maxVolume: v.optional(v.number()),
    minOpenInterest: v.optional(v.number()),
    maxIV: v.optional(v.number()),
    minIV: v.optional(v.number()),
    maxDaysToExpiry: v.optional(v.number()),
    minProbabilityOfProfit: v.optional(v.number()),
    oversoldOnly: v.optional(v.boolean()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let options = await ctx.db.query("optionsData").collect();

    // Apply filters
    if (args.tickerFilter && args.tickerFilter.trim() !== "") {
      const filter = args.tickerFilter.toUpperCase();
      options = options.filter(o => o.ticker.includes(filter));
    }

    if (args.oversoldOnly) {
      options = options.filter(o => o.isOversold);
    }

    if (args.minVolume !== undefined) {
      options = options.filter(o => o.volume >= args.minVolume!);
    }

    if (args.maxVolume !== undefined) {
      options = options.filter(o => o.volume <= args.maxVolume!);
    }

    if (args.minOpenInterest !== undefined) {
      options = options.filter(o => o.openInterest >= args.minOpenInterest!);
    }

    if (args.minIV !== undefined) {
      options = options.filter(o => o.impliedVolatility >= args.minIV!);
    }

    if (args.maxIV !== undefined) {
      options = options.filter(o => o.impliedVolatility <= args.maxIV!);
    }

    if (args.maxDaysToExpiry !== undefined) {
      const now = Date.now();
      options = options.filter(o => {
        const expiry = new Date(o.expirationDate).getTime();
        const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return days <= args.maxDaysToExpiry!;
      });
    }

    if (args.minProbabilityOfProfit !== undefined) {
      options = options.filter(o => o.probabilityOfProfit >= args.minProbabilityOfProfit!);
    }

    // Sort
    const sortBy = args.sortBy || "probabilityOfProfit";
    const sortOrder = args.sortOrder || "desc";

    options.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortBy] as number;
      const bVal = (b as Record<string, unknown>)[sortBy] as number;
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });

    return options.slice(0, 100);
  },
});

// Get tickers list
export const getTickers = query({
  args: {},
  handler: async () => {
    return TICKERS;
  },
});

// Seed initial data
export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("optionsData").first();
    if (existing) return { seeded: false, message: "Data already exists" };

    const now = Date.now();
    const tickersToSeed = TICKERS.slice(0, 15); // Seed first 15 tickers

    for (const ticker of tickersToSeed) {
      const options = generateOptionData(ticker, now);
      for (const option of options) {
        await ctx.db.insert("optionsData", option);
      }
    }

    return { seeded: true, message: `Seeded data for ${tickersToSeed.length} tickers` };
  },
});

// Refresh data for a specific ticker
export const refreshTicker = mutation({
  args: { ticker: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete old data for this ticker
    const oldOptions = await ctx.db
      .query("optionsData")
      .withIndex("by_ticker", q => q.eq("ticker", args.ticker))
      .collect();

    for (const option of oldOptions) {
      await ctx.db.delete(option._id);
    }

    // Generate new data
    const now = Date.now();
    const options = generateOptionData(args.ticker, now);
    for (const option of options) {
      await ctx.db.insert("optionsData", option);
    }

    return { refreshed: true };
  },
});

// Get stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const options = await ctx.db.query("optionsData").collect();
    const oversold = options.filter(o => o.isOversold);
    const uniqueTickers = new Set(options.map(o => o.ticker));

    return {
      totalOptions: options.length,
      oversoldCount: oversold.length,
      tickersCount: uniqueTickers.size,
      avgIV: options.length > 0
        ? Math.round(options.reduce((sum, o) => sum + o.impliedVolatility, 0) / options.length * 10) / 10
        : 0,
    };
  },
});
