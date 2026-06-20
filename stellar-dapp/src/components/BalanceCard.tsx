"use client";

import { useEffect, useState, useCallback } from "react";
import { getXLMBalance } from "@/lib/stellar";

interface BalanceCardProps {
  publicKey: string;
}

export default function BalanceCard({ publicKey }: BalanceCardProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const bal = await getXLMBalance(publicKey);
      setBalance(bal);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch balance";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-800/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
          XLM Balance
        </h2>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition"
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {loading && balance === null ? (
        <div className="h-10 w-40 bg-zinc-700 animate-pulse rounded-lg" />
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white tabular-nums">
            {balance ?? "—"}
          </span>
          <span className="text-lg text-zinc-400 font-medium">XLM</span>
        </div>
      )}

      <p className="text-xs text-zinc-600 mt-3">Stellar Testnet</p>
    </div>
  );
}
