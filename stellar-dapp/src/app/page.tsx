"use client";

import { useState, useCallback } from "react";
import WalletPanel from "@/components/WalletPanel";
import BalanceCard from "@/components/BalanceCard";
import SendForm from "@/components/SendForm";

export default function Home() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balanceKey, setBalanceKey] = useState(0);

  const handleConnected = useCallback((key: string) => {
    setPublicKey((prev) => (prev === key ? prev : key));
  }, []);

  const handleDisconnected = useCallback(() => {
    setPublicKey(null);
  }, []);

  const refreshBalance = useCallback(() => {
    setBalanceKey((k) => k + 1);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-600/30 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-300 font-medium tracking-wide">
              Stellar Testnet
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Stellar Pay</h1>
          <p className="text-zinc-400 text-sm">
            Send XLM on the Stellar testnet with Freighter wallet
          </p>
        </div>

        {/* Wallet */}
        <div className="space-y-4">
          <WalletPanel
            onConnected={handleConnected}
            onDisconnected={handleDisconnected}
          />

          {publicKey && (
            <>
              <BalanceCard key={`balance-${balanceKey}`} publicKey={publicKey} />
              <SendForm
                sourcePublicKey={publicKey}
                onSuccess={refreshBalance}
              />

              {/* Faucet hint */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                <p className="text-xs text-zinc-500">
                  Need testnet XLM?{" "}
                  <a
                    href="https://laboratory.stellar.org/account-creator?network=testnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Fund via Stellar Laboratory
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
