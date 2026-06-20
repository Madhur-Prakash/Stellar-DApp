"use client";

import { useState, useEffect, useCallback } from "react";

export interface FreighterState {
  isInstalled: boolean;
  isConnected: boolean;
  publicKey: string | null;
  error: string | null;
  connecting: boolean;
}

// Persists across page reloads. Cleared when the user explicitly connects.
const DISCONNECT_KEY = "stellar_dapp_disconnected";

export function useFreighter() {
  const [state, setState] = useState<FreighterState>({
    isInstalled: false,
    isConnected: false,
    publicKey: null,
    error: null,
    connecting: false,
  });

  useEffect(() => {
    const checkInstall = async () => {
      try {
        const { isConnected, getAddress } = await import("@stellar/freighter-api");
        const result = await isConnected();
        const installed = result.isConnected;
        setState((s) => ({ ...s, isInstalled: installed }));

        // Only auto-connect if the user hasn't explicitly disconnected this session.
        if (installed && !localStorage.getItem(DISCONNECT_KEY)) {
          const addr = await getAddress();
          if (addr.address) {
            setState((s) => ({
              ...s,
              isConnected: true,
              publicKey: addr.address,
            }));
          }
        }
      } catch {
        setState((s) => ({ ...s, isInstalled: false }));
      }
    };
    checkInstall();
  }, []);

  // Returns the public key on success, null on failure.
  const connect = useCallback(async (): Promise<string | null> => {
    localStorage.removeItem(DISCONNECT_KEY);
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const { requestAccess, getAddress } = await import("@stellar/freighter-api");
      await requestAccess();
      const result = await getAddress();
      if (!result.address) throw new Error("No address returned from Freighter");
      setState((s) => ({
        ...s,
        isConnected: true,
        publicKey: result.address,
        connecting: false,
        error: null,
      }));
      return result.address;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setState((s) => ({ ...s, connecting: false, error: msg }));
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.setItem(DISCONNECT_KEY, "1");
    setState((s) => ({
      ...s,
      isConnected: false,
      publicKey: null,
      error: null,
    }));
  }, []);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    const { signTransaction } = await import("@stellar/freighter-api");
    const result = await signTransaction(xdr, {
      networkPassphrase: "Test SDF Network ; September 2015",
    });
    if (result.signedTxXdr) return result.signedTxXdr;
    throw new Error("Signing failed or was rejected");
  }, []);

  return { ...state, connect, disconnect, signTransaction };
}
