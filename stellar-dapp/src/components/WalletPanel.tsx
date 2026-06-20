"use client";

import { useEffect, useRef } from "react";
import { useFreighter } from "@/hooks/useFreighter";
import { truncateAddress } from "@/lib/stellar";

interface WalletPanelProps {
  onConnected: (publicKey: string) => void;
  onDisconnected: () => void;
}

export default function WalletPanel({ onConnected, onDisconnected }: WalletPanelProps) {
  const { isInstalled, isConnected, publicKey, error, connecting, connect, disconnect } =
    useFreighter();

  // Notifies parent once when Freighter auto-detects an existing session on page load.
  const autoNotified = useRef(false);
  useEffect(() => {
    if (isConnected && publicKey && !autoNotified.current) {
      autoNotified.current = true;
      onConnected(publicKey);
    }
    if (!isConnected) {
      autoNotified.current = false;
    }
  }, [isConnected, publicKey, onConnected]);

  // Explicit connect button — calls onConnected directly from the result.
  const handleConnect = async () => {
    const key = await connect();
    if (key) {
      autoNotified.current = true; // prevent the effect from double-firing
      onConnected(key);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onDisconnected();
  };

  if (!isInstalled) {
    return (
      <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-center">
        <p className="text-yellow-300 font-medium mb-3">Freighter wallet not detected</p>
        <a
          href="https://freighter.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-yellow-400 text-black font-bold px-5 py-2 rounded-xl hover:bg-yellow-300 transition"
        >
          Install Freighter →
        </a>
        <p className="text-xs text-zinc-500 mt-3">After installing, refresh this page</p>
      </div>
    );
  }

  if (isConnected && publicKey) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Connected</p>
          <p className="text-green-400 font-mono font-semibold text-sm">
            {truncateAddress(publicKey)}
          </p>
        </div>
        <button
          onClick={handleDisconnect}
          className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-800/50 p-5 text-center">
      <p className="text-zinc-400 mb-4 text-sm">Connect your Freighter wallet to get started</p>
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition w-full"
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-3">{error}</p>
      )}
    </div>
  );
}
