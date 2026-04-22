import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// Auth form component
function AuthForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("flow", flow);
      await signIn("password", formData);
    } catch (err) {
      setError(flow === "signIn" ? "Invalid credentials" : "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <span className="text-lg font-medium text-neutral-800 tracking-tight">OptiScan</span>
        </div>

        <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
          Find oversold call options on low-price stocks. Real-time scanning for day trading opportunities.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400"
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium text-white bg-neutral-800 rounded-md hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : flow === "signIn" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-4">
          {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            className="text-neutral-800 hover:underline"
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </p>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
        </div>

        <button
          onClick={() => signIn("anonymous")}
          className="w-full py-2.5 text-sm text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
        >
          Continue as guest
        </button>

        <p className="text-center text-xs text-neutral-400 mt-12">
          Requested by @Quincy · Built by @clonkbot
        </p>
      </div>
    </div>
  );
}

// Filter panel
interface FilterState {
  tickerFilter: string;
  minVolume: number | undefined;
  maxVolume: number | undefined;
  minOpenInterest: number | undefined;
  minIV: number | undefined;
  maxIV: number | undefined;
  maxDaysToExpiry: number | undefined;
  minProbabilityOfProfit: number | undefined;
  oversoldOnly: boolean;
  sortBy: string;
  sortOrder: string;
}

function FilterPanel({
  filters,
  setFilters,
  onReset,
}: {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  onReset: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-neutral-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <input
              type="text"
              placeholder="Search ticker..."
              value={filters.tickerFilter}
              onChange={(e) => setFilters({ ...filters, tickerFilter: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.oversoldOnly}
              onChange={(e) => setFilters({ ...filters, oversoldOnly: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-800 focus:ring-neutral-500"
            />
            Oversold only
          </label>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 text-sm text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="hidden sm:inline">Filters</span>
          </button>

          <button
            onClick={onReset}
            className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Reset
          </button>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t border-neutral-100">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Min Volume</label>
              <input
                type="number"
                value={filters.minVolume ?? ""}
                onChange={(e) => setFilters({ ...filters, minVolume: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Min Open Interest</label>
              <input
                type="number"
                value={filters.minOpenInterest ?? ""}
                onChange={(e) => setFilters({ ...filters, minOpenInterest: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Min IV %</label>
              <input
                type="number"
                value={filters.minIV ?? ""}
                onChange={(e) => setFilters({ ...filters, minIV: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Max IV %</label>
              <input
                type="number"
                value={filters.maxIV ?? ""}
                onChange={(e) => setFilters({ ...filters, maxIV: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Max Days to Expiry</label>
              <input
                type="number"
                value={filters.maxDaysToExpiry ?? ""}
                onChange={(e) => setFilters({ ...filters, maxDaysToExpiry: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Min PoP %</label>
              <input
                type="number"
                value={filters.minProbabilityOfProfit ?? ""}
                onChange={(e) => setFilters({ ...filters, minProbabilityOfProfit: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                placeholder="50"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Option data type
interface OptionData {
  _id: Id<"optionsData">;
  ticker: string;
  strikePrice: number;
  expirationDate: string;
  sharePrice: number;
  optionPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  theta: number;
  probabilityOfProfit: number;
  rsiValue: number;
  isOversold: boolean;
}

// Option row component
function OptionRow({ option, onAddToWatchlist }: {
  option: OptionData;
  onAddToWatchlist: (ticker: string) => void;
}) {
  const daysToExpiry = Math.ceil(
    (new Date(option.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <tr className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
      <td className="py-3 px-3 md:px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddToWatchlist(option.ticker)}
            className="p-1 text-neutral-300 hover:text-neutral-500 transition-colors"
            title="Add to watchlist"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <div>
            <span className="font-medium text-neutral-800">{option.ticker}</span>
            {option.isOversold && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                OVERSOLD
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-2 md:px-4 text-sm text-neutral-600">${option.strikePrice.toFixed(2)}</td>
      <td className="py-3 px-2 md:px-4 text-sm text-neutral-600 hidden sm:table-cell">
        <div>{option.expirationDate}</div>
        <div className="text-xs text-neutral-400">{daysToExpiry}d</div>
      </td>
      <td className="py-3 px-2 md:px-4 text-sm text-neutral-600">${option.sharePrice.toFixed(2)}</td>
      <td className="py-3 px-2 md:px-4 text-sm text-neutral-600 hidden md:table-cell">
        <div>${option.optionPrice.toFixed(2)}</div>
        <div className="text-xs text-neutral-400">
          ${option.bid.toFixed(2)} / ${option.ask.toFixed(2)}
        </div>
      </td>
      <td className="py-3 px-2 md:px-4 text-sm text-neutral-600 hidden lg:table-cell">
        <div className={`font-medium ${option.probabilityOfProfit >= 50 ? 'text-emerald-600' : 'text-neutral-600'}`}>
          {option.probabilityOfProfit.toFixed(1)}%
        </div>
      </td>
      <td className="py-3 px-2 md:px-4 text-sm text-neutral-600 hidden md:table-cell">
        {option.volume.toLocaleString()}
      </td>
      <td className="py-3 px-2 md:px-4 text-sm text-neutral-600 hidden lg:table-cell">
        {option.openInterest.toLocaleString()}
      </td>
      <td className="py-3 px-2 md:px-4 text-sm text-neutral-600 hidden lg:table-cell">
        <div className={option.impliedVolatility > 50 ? 'text-amber-600' : ''}>
          {option.impliedVolatility.toFixed(1)}%
        </div>
      </td>
      <td className="py-3 px-2 md:px-4 text-sm text-neutral-500 hidden xl:table-cell">
        <div className="text-xs space-y-0.5">
          <div>Δ {option.delta.toFixed(3)}</div>
          <div>Θ {option.theta.toFixed(2)}</div>
        </div>
      </td>
      <td className="py-3 px-2 md:px-4 text-sm hidden sm:table-cell">
        <div className={`text-xs px-2 py-1 rounded ${
          option.rsiValue < 30
            ? 'bg-emerald-50 text-emerald-600'
            : option.rsiValue > 70
              ? 'bg-red-50 text-red-600'
              : 'bg-neutral-50 text-neutral-600'
        }`}>
          RSI {option.rsiValue.toFixed(0)}
        </div>
      </td>
    </tr>
  );
}

// Mobile option card
function OptionCard({ option, onAddToWatchlist }: {
  option: OptionData;
  onAddToWatchlist: (ticker: string) => void;
}) {
  const daysToExpiry = Math.ceil(
    (new Date(option.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="border-b border-neutral-100 py-4 px-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-800">{option.ticker}</span>
          {option.isOversold && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">
              OVERSOLD
            </span>
          )}
        </div>
        <button
          onClick={() => onAddToWatchlist(option.ticker)}
          className="p-1 text-neutral-300 hover:text-neutral-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-neutral-400 mb-0.5">Strike</div>
          <div className="text-neutral-700">${option.strikePrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-400 mb-0.5">Share Price</div>
          <div className="text-neutral-700">${option.sharePrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-400 mb-0.5">Option</div>
          <div className="text-neutral-700">${option.optionPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-400 mb-0.5">Expiry</div>
          <div className="text-neutral-700">{daysToExpiry}d</div>
        </div>
        <div>
          <div className="text-xs text-neutral-400 mb-0.5">PoP</div>
          <div className={`font-medium ${option.probabilityOfProfit >= 50 ? 'text-emerald-600' : 'text-neutral-700'}`}>
            {option.probabilityOfProfit.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-400 mb-0.5">IV</div>
          <div className={option.impliedVolatility > 50 ? 'text-amber-600' : 'text-neutral-700'}>
            {option.impliedVolatility.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
        <span>Vol: {option.volume.toLocaleString()}</span>
        <span>OI: {option.openInterest.toLocaleString()}</span>
        <span className={`px-1.5 py-0.5 rounded ${
          option.rsiValue < 30
            ? 'bg-emerald-50 text-emerald-600'
            : option.rsiValue > 70
              ? 'bg-red-50 text-red-600'
              : 'bg-neutral-50 text-neutral-600'
        }`}>
          RSI {option.rsiValue.toFixed(0)}
        </span>
      </div>
    </div>
  );
}

// Stats bar
function StatsBar({ stats }: {
  stats: { totalOptions: number; oversoldCount: number; tickersCount: number; avgIV: number } | undefined;
}) {
  if (!stats) return null;

  return (
    <div className="border-b border-neutral-100 bg-neutral-50/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm">
          <div>
            <span className="text-neutral-400">Scanning </span>
            <span className="text-neutral-700 font-medium">{stats.tickersCount}</span>
            <span className="text-neutral-400"> tickers</span>
          </div>
          <div>
            <span className="text-neutral-400">Found </span>
            <span className="text-neutral-700 font-medium">{stats.totalOptions.toLocaleString()}</span>
            <span className="text-neutral-400"> options</span>
          </div>
          <div>
            <span className="text-emerald-600 font-medium">{stats.oversoldCount}</span>
            <span className="text-neutral-400"> oversold</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-neutral-400">Avg IV: </span>
            <span className="text-neutral-700">{stats.avgIV}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main dashboard
function Dashboard() {
  const { signOut } = useAuthActions();
  const [filters, setFilters] = useState<FilterState>({
    tickerFilter: "",
    minVolume: undefined,
    maxVolume: undefined,
    minOpenInterest: undefined,
    minIV: undefined,
    maxIV: undefined,
    maxDaysToExpiry: undefined,
    minProbabilityOfProfit: undefined,
    oversoldOnly: true,
    sortBy: "probabilityOfProfit",
    sortOrder: "desc",
  });

  const options = useQuery(api.options.getOptions, {
    tickerFilter: filters.tickerFilter || undefined,
    minVolume: filters.minVolume,
    maxVolume: filters.maxVolume,
    minOpenInterest: filters.minOpenInterest,
    minIV: filters.minIV,
    maxIV: filters.maxIV,
    maxDaysToExpiry: filters.maxDaysToExpiry,
    minProbabilityOfProfit: filters.minProbabilityOfProfit,
    oversoldOnly: filters.oversoldOnly,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const stats = useQuery(api.options.getStats);
  const seedData = useMutation(api.options.seedData);
  const addToWatchlist = useMutation(api.watchlist.add);

  useEffect(() => {
    seedData();
  }, [seedData]);

  const handleAddToWatchlist = async (ticker: string) => {
    try {
      await addToWatchlist({ ticker });
    } catch (e) {
      // Silently handle - user might not be logged in
    }
  };

  const resetFilters = () => {
    setFilters({
      tickerFilter: "",
      minVolume: undefined,
      maxVolume: undefined,
      minOpenInterest: undefined,
      minIV: undefined,
      maxIV: undefined,
      maxDaysToExpiry: undefined,
      minProbabilityOfProfit: undefined,
      oversoldOnly: true,
      sortBy: "probabilityOfProfit",
      sortOrder: "desc",
    });
  };

  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      setFilters({
        ...filters,
        sortOrder: filters.sortOrder === "desc" ? "asc" : "desc",
      });
    } else {
      setFilters({
        ...filters,
        sortBy: column,
        sortOrder: "desc",
      });
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (filters.sortBy !== column) return null;
    return (
      <svg className="w-3 h-3 ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {filters.sortOrder === "desc" ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        )}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span className="text-lg font-medium text-neutral-800 tracking-tight">OptiScan</span>
          </div>

          <button
            onClick={() => signOut()}
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <StatsBar stats={stats} />
      <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} />

      {/* Options table - desktop */}
      <div className="flex-1 overflow-auto hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {options === undefined ? (
            <div className="py-20 text-center text-sm text-neutral-400">Loading options...</div>
          ) : options.length === 0 ? (
            <div className="py-20 text-center text-sm text-neutral-400">
              No options found matching your filters
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-3 md:px-4 font-medium">
                    <button onClick={() => handleSort("ticker")} className="hover:text-neutral-600">
                      Ticker <SortIcon column="ticker" />
                    </button>
                  </th>
                  <th className="py-3 px-2 md:px-4 font-medium">
                    <button onClick={() => handleSort("strikePrice")} className="hover:text-neutral-600">
                      Strike <SortIcon column="strikePrice" />
                    </button>
                  </th>
                  <th className="py-3 px-2 md:px-4 font-medium hidden sm:table-cell">Expiry</th>
                  <th className="py-3 px-2 md:px-4 font-medium">
                    <button onClick={() => handleSort("sharePrice")} className="hover:text-neutral-600">
                      Price <SortIcon column="sharePrice" />
                    </button>
                  </th>
                  <th className="py-3 px-2 md:px-4 font-medium hidden md:table-cell">Bid/Ask</th>
                  <th className="py-3 px-2 md:px-4 font-medium hidden lg:table-cell">
                    <button onClick={() => handleSort("probabilityOfProfit")} className="hover:text-neutral-600">
                      PoP <SortIcon column="probabilityOfProfit" />
                    </button>
                  </th>
                  <th className="py-3 px-2 md:px-4 font-medium hidden md:table-cell">
                    <button onClick={() => handleSort("volume")} className="hover:text-neutral-600">
                      Volume <SortIcon column="volume" />
                    </button>
                  </th>
                  <th className="py-3 px-2 md:px-4 font-medium hidden lg:table-cell">
                    <button onClick={() => handleSort("openInterest")} className="hover:text-neutral-600">
                      OI <SortIcon column="openInterest" />
                    </button>
                  </th>
                  <th className="py-3 px-2 md:px-4 font-medium hidden lg:table-cell">
                    <button onClick={() => handleSort("impliedVolatility")} className="hover:text-neutral-600">
                      IV <SortIcon column="impliedVolatility" />
                    </button>
                  </th>
                  <th className="py-3 px-2 md:px-4 font-medium hidden xl:table-cell">Greeks</th>
                  <th className="py-3 px-2 md:px-4 font-medium hidden sm:table-cell">
                    <button onClick={() => handleSort("rsiValue")} className="hover:text-neutral-600">
                      RSI <SortIcon column="rsiValue" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {options.map((option: OptionData) => (
                  <OptionRow
                    key={option._id}
                    option={option}
                    onAddToWatchlist={handleAddToWatchlist}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Options list - mobile */}
      <div className="flex-1 overflow-auto sm:hidden">
        {options === undefined ? (
          <div className="py-20 text-center text-sm text-neutral-400">Loading options...</div>
        ) : options.length === 0 ? (
          <div className="py-20 text-center text-sm text-neutral-400">
            No options found matching your filters
          </div>
        ) : (
          <div>
            {options.map((option: OptionData) => (
              <OptionCard
                key={option._id}
                option={option}
                onAddToWatchlist={handleAddToWatchlist}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-4">
        <p className="text-center text-xs text-neutral-400">
          Requested by @Quincy · Built by @clonkbot
        </p>
      </footer>
    </div>
  );
}

// Main app component
export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return <Dashboard />;
}
