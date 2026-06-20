# Architecture

> **Navigation:** [← README](../README.md) · [Components](components.md) · [Stellar Concepts](stellar-concepts.md) · [Setup Guide](setup.md)

---

## Overview

Stellar Pay is a **fully client-side** dApp. There is no backend server, no database, and no API keys. Every operation runs in the user's browser and communicates directly with Stellar's public infrastructure.

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                       │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Next.js App (App Router)               │   │
│   │                                                     │   │
│   │   page.tsx  (state orchestrator)                    │   │
│   │     ├── WalletPanel.tsx                             │   │
│   │     ├── BalanceCard.tsx                             │   │
│   │     └── SendForm.tsx                                │   │
│   │                                                     │   │
│   │   hooks/useFreighter.ts  ←→  Freighter Extension    │   │
│   │   lib/stellar.ts         ←→  Horizon Testnet API    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌──────────────────────┐   ┌───────────────────────┐      │
│   │  Freighter Extension │   │     localStorage      │      │
│   │  (signs txs, holds   │   │  (disconnect flag     │      │
│   │   private key)       │   │   persists reloads)   │      │
│   └──────────────────────┘   └───────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
              ┌───────────────────────────────┐
              │  horizon-testnet.stellar.org  │
              │  (Stellar Foundation's API)   │
              │                               │
              │  GET  /accounts/{publicKey}   │
              │  POST /transactions           │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     Stellar Testnet Nodes     │
              └───────────────────────────────┘
```

---

## Data Flow

### 1. Wallet Connection

```
User clicks "Connect Wallet"
    → useFreighter.connect()
        → localStorage.removeItem("stellar_dapp_disconnected")
        → freighter-api: requestAccess()     (user approves in Freighter popup)
        → freighter-api: getAddress()        (returns G... public key)
        → returns publicKey string
    → WalletPanel.handleConnect() receives key → calls onConnected(key)
    → page.tsx sets publicKey state
    → BalanceCard and SendForm mount
```

**Auto-connect on page load** (if user was previously connected):
```
page loads → useFreighter useEffect
    → freighter-api: isConnected()           (is extension present?)
    → check localStorage for disconnect flag
    → if installed AND no flag: getAddress() → auto-connect
    → if flag is set: stay disconnected (user explicitly disconnected)
```

### 2. Wallet Disconnect

```
User clicks "Disconnect"
    → useFreighter.disconnect()
        → localStorage.setItem("stellar_dapp_disconnected", "1")
        → clears isConnected + publicKey from React state
    → WalletPanel.onDisconnected() → page.tsx sets publicKey = null
    → BalanceCard and SendForm unmount
    → on next page reload: disconnect flag is found → no auto-connect
```

### 3. Balance Fetch

```
BalanceCard mounts with publicKey prop
    → lib/stellar.getXLMBalance(publicKey)
        → Horizon.Server.loadAccount(publicKey)
            → GET horizon-testnet.stellar.org/accounts/{publicKey}
        → filters balances[] for asset_type === "native"
        → returns formatted string (e.g. "9850.0000000")
    → displayed in UI; refresh button re-triggers same call
```

### 4. Send XLM Transaction

```
User fills form → clicks "Send XLM"
    → lib/stellar.buildSendXLMTransaction(source, dest, amount, memo)
        → server.loadAccount(source)         (fetches current sequence number)
        → TransactionBuilder
              .addOperation(Operation.payment({ dest, asset: XLM, amount }))
              .addMemo(Memo.text(memo))       (if provided)
              .setTimeout(180)
              .build()
              .toXDR()                       (serializes → base64 XDR string)
    → useFreighter.signTransaction(xdr)
        → freighter-api: signTransaction(xdr, { networkPassphrase: TESTNET })
        → Freighter popup: user reviews and approves
        → returns signedXdr
    → lib/stellar.submitTransaction(signedXdr)
        → TransactionBuilder.fromXDR(signedXdr, TESTNET)
        → server.submitTransaction(tx)
            → POST horizon-testnet.stellar.org/transactions
        → returns result.hash
    → UI shows success panel with hash + Stellar Expert link
    → onSuccess() fires → page.tsx increments balanceKey → BalanceCard remounts
```

---

## Component Tree

```
page.tsx
│  state: publicKey (string | null)        ← drives conditional rendering
│  state: balanceKey (number)              ← forces BalanceCard remount on tx
│
├── WalletPanel                            ← always rendered
│     props: onConnected, onDisconnected
│     uses:  useFreighter hook
│     renders one of:
│       • install prompt (Freighter not detected)
│       • connect button (not connected)
│       • address + disconnect (connected)
│
├── BalanceCard                            ← only when publicKey is set
│     props: publicKey
│     calls: lib/stellar.getXLMBalance
│     renders: balance or loading skeleton or error
│
└── SendForm                               ← only when publicKey is set
      props: sourcePublicKey, onSuccess
      uses:  useFreighter.signTransaction
      calls: lib/stellar.buildSendXLMTransaction
             lib/stellar.submitTransaction
      renders: form inputs + transaction result panel
```

> See [components.md](components.md) for full props, state, and render-state documentation for each component.

---

## State Management

State is managed entirely with **React hooks** — no external store (Redux, Zustand, etc.).

| Location | State | Purpose |
|---|---|---|
| `page.tsx` | `publicKey` | Currently connected wallet address |
| `page.tsx` | `balanceKey` | Forces BalanceCard remount after a tx success |
| `useFreighter` | `isInstalled`, `isConnected`, `publicKey`, `connecting`, `error` | Wallet lifecycle |
| `localStorage` | `stellar_dapp_disconnected` | Persists disconnect intent across reloads |
| `BalanceCard` | `balance`, `loading`, `error` | Balance fetch state |
| `SendForm` | `destination`, `amount`, `memo`, `loading`, `result` | Form + tx state |

---

## Key Design Decisions

**No backend** — Stellar's Horizon API is public and CORS-enabled, so all reads and writes go directly from the browser. A backend would add complexity and a point of failure with no benefit.

**`"use client"` everywhere** — Every component uses browser APIs (Freighter extension, Horizon HTTP). The app is fully client-rendered. Next.js App Router is used for routing and metadata, not SSR.

**`localStorage` for disconnect persistence** — Freighter has no "revoke access" API. Without persisting the disconnect intent, reloading the page would auto-reconnect the wallet (since Freighter still remembers the site as authorized). Storing a flag in `localStorage` prevents this until the user explicitly reconnects.

**`balanceKey` remount pattern** — After a successful transaction, the page increments `balanceKey`, which changes the `key` prop on `BalanceCard`. React unmounts and remounts it, triggering a fresh balance fetch. This keeps `SendForm` and `BalanceCard` fully decoupled.

**`connect()` returns the public key** — Rather than relying on a `useEffect` to detect when `publicKey` becomes available (which can misfire during connect/disconnect cycles), `connect()` returns the key directly. `WalletPanel.handleConnect` calls `onConnected(key)` as a direct event handler response.

**XDR as the handoff format** — The app builds an unsigned transaction as XDR, hands it to Freighter for signing, then submits the signed XDR to Horizon. The private key never touches the app — only Freighter handles it. See [stellar-concepts.md](stellar-concepts.md#xdr-external-data-representation) for details.
