"use client";

import { useState, FormEvent } from "react";
import { useFreighter } from "@/hooks/useFreighter";
import {
  buildSendXLMTransaction,
  submitTransaction,
  isValidStellarAddress,
} from "@/lib/stellar";

interface TxResult {
  success: boolean;
  hash?: string;
  error?: string;
}

interface SendFormProps {
  sourcePublicKey: string;
  onSuccess?: () => void;
}

export default function SendForm({ sourcePublicKey, onSuccess }: SendFormProps) {
  const { signTransaction } = useFreighter();

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TxResult | null>(null);

  const destValid = destination === "" || isValidStellarAddress(destination);
  const amountValid = amount === "" || (!isNaN(Number(amount)) && Number(amount) > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!isValidStellarAddress(destination)) {
      setResult({ success: false, error: "Invalid Stellar destination address." });
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setResult({ success: false, error: "Enter a valid positive amount." });
      return;
    }

    setLoading(true);
    try {
      const xdr = await buildSendXLMTransaction(
        sourcePublicKey,
        destination,
        amount,
        memo
      );
      const signedXdr = await signTransaction(xdr);
      const hash = await submitTransaction(signedXdr);
      setResult({ success: true, hash });
      setDestination("");
      setAmount("");
      setMemo("");
      onSuccess?.();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      // Horizon often wraps errors in result_codes
      let msg = raw;
      try {
        const parsed = JSON.parse(raw);
        msg =
          parsed?.response?.data?.extras?.result_codes?.operations?.[0] ??
          parsed?.response?.data?.title ??
          raw;
      } catch {
        // keep raw
      }
      setResult({ success: false, error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-800/50 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-5">
        Send XLM
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Destination Address</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="G..."
            className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:ring-2 transition ${
              !destValid
                ? "border-red-500 focus:ring-red-500"
                : "border-zinc-700 focus:ring-indigo-500"
            }`}
          />
          {!destValid && (
            <p className="text-red-400 text-xs mt-1">Invalid Stellar address</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Amount (XLM)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            min="0.0000001"
            step="any"
            className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 transition ${
              !amountValid
                ? "border-red-500 focus:ring-red-500"
                : "border-zinc-700 focus:ring-indigo-500"
            }`}
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Memo <span className="text-zinc-600">(optional)</span>
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Add a note…"
            maxLength={28}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
        >
          {loading ? "Signing & Sending…" : "Send XLM"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-5 rounded-xl p-4 border ${
            result.success
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          {result.success ? (
            <>
              <p className="text-green-400 font-semibold mb-2">Transaction Successful!</p>
              <p className="text-xs text-zinc-400 mb-1">Transaction Hash:</p>
              <p className="font-mono text-xs text-white break-all">{result.hash}</p>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                View on Stellar Expert →
              </a>
            </>
          ) : (
            <>
              <p className="text-red-400 font-semibold mb-1">Transaction Failed</p>
              <p className="text-xs text-zinc-400">{result.error}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
