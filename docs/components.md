# Component Reference

> **Navigation:** [← README](../README.md) · [Architecture](architecture.md) · [Stellar Concepts](stellar-concepts.md) · [Setup Guide](setup.md)

All components are React Client Components (`"use client"`). They live in `stellar-dapp/src/components/`.

---

## `WalletPanel`

**File:** `src/components/WalletPanel.tsx`  
**Purpose:** Handles Freighter wallet connection and disconnection. Shows one of three states based on wallet availability.

### Props

| Prop | Type | Description |
|---|---|---|
| `onConnected` | `(publicKey: string) => void` | Called with the G... address after wallet connects |
| `onDisconnected` | `() => void` | Called when the user clicks Disconnect |

### Render States

**1. Freighter not installed**
```
┌─────────────────────────────────────────┐
│  Freighter wallet not detected          │
│                                         │
│        [ Install Freighter → ]          │
│  After installing, refresh this page    │
└─────────────────────────────────────────┘
```
Yellow warning card with a link to [freighter.app](https://freighter.app).

**2. Not connected**
```
┌─────────────────────────────────────────┐
│  Connect your Freighter wallet          │
│                                         │
│        [ Connect Wallet ]               │
│                                         │
│  (error message if rejected)            │
└─────────────────────────────────────────┘
```

**3. Connected**
```
┌─────────────────────────────────────────┐
│  CONNECTED                              │
│  GABCD...WXYZ            [Disconnect]   │
└─────────────────────────────────────────┘
```
Green card showing truncated address (first 6 + last 6 chars via `truncateAddress`).

### Behavior Notes

- **Button-click connect**: `handleConnect` awaits `connect()` which returns the public key, then calls `onConnected(key)` directly — no state-watching effect needed.
- **Page-load auto-connect**: A `useEffect` fires once on mount; if `isConnected && publicKey` are already set (Freighter had a prior session), it notifies the parent. A `useRef` prevents this from double-firing if the user also clicked connect.
- **Disconnect persists across reloads**: `disconnect()` sets a `localStorage` flag so the app stays disconnected after reload. See [architecture.md](architecture.md#2-wallet-disconnect) for the full flow.
- The Connect button is disabled while `connecting === true`.

---

## `BalanceCard`

**File:** `src/components/BalanceCard.tsx`  
**Purpose:** Fetches and displays the connected wallet's native XLM balance from Horizon Testnet.

### Props

| Prop | Type | Description |
|---|---|---|
| `publicKey` | `string` | The connected wallet's Stellar public key |

### Local State

| State | Type | Description |
|---|---|---|
| `balance` | `string \| null` | Formatted balance to 7 decimal places, or null before first fetch |
| `loading` | `boolean` | True while the Horizon request is in flight |
| `error` | `string \| null` | Error message if the account fetch fails |

### Render States

**Loading (initial)**
```
┌────────────────────────────────┐
│  XLM BALANCE          ↻ Refresh│
│  ░░░░░░░░░░░░░░░               │  ← animated pulse skeleton
│  Stellar Testnet               │
└────────────────────────────────┘
```

**Loaded**
```
┌────────────────────────────────┐
│  XLM BALANCE          ↻ Refresh│
│  9850.0000000 XLM              │
│  Stellar Testnet               │
└────────────────────────────────┘
```

**Error**
```
┌────────────────────────────────┐
│  XLM BALANCE          ↻ Refresh│
│  Account not found             │
│  Stellar Testnet               │
└────────────────────────────────┘
```

### Behavior Notes

- Auto-fetches on mount via `useEffect` + `useCallback`.
- The **↻ Refresh** button re-triggers the same fetch.
- The parent page remounts this component (via a `key` change) after a successful transaction — see [architecture.md](architecture.md#balancekey-remount-pattern).
- `"Account not found"` means the account has never been funded — use the [Stellar Laboratory faucet](https://laboratory.stellar.org/account-creator?network=testnet). See [stellar-concepts.md](stellar-concepts.md#minimum-account-balance) for why minimum balance matters.

---

## `SendForm`

**File:** `src/components/SendForm.tsx`  
**Purpose:** Builds, signs, and submits an XLM payment transaction. Shows success or failure feedback inline.

### Props

| Prop | Type | Description |
|---|---|---|
| `sourcePublicKey` | `string` | The sender's public key (from connected wallet) |
| `onSuccess` | `() => void` (optional) | Called after a transaction is successfully confirmed |

### Local State

| State | Type | Description |
|---|---|---|
| `destination` | `string` | Recipient's Stellar address |
| `amount` | `string` | XLM amount (string to avoid float precision issues) |
| `memo` | `string` | Optional text memo (max 28 chars — Stellar limit) |
| `loading` | `boolean` | True while signing or submitting |
| `result` | `TxResult \| null` | `{ success: bool, hash?: string, error?: string }` |

### Input Validation

Validated inline as the user types — the field border turns red immediately:

| Field | Rule |
|---|---|
| Destination | Valid Ed25519 public key (`G...`, 56 chars) — checked with `StrKey.isValidEd25519PublicKey` |
| Amount | Positive number; Stellar supports up to 7 decimal places |
| Memo | Optional; hard-capped at 28 characters (Stellar text memo limit) |

### Transaction Result Panel

**Success**
```
┌──────────────────────────────────────────────┐
│  Transaction Successful!                     │
│                                              │
│  Transaction Hash:                           │
│  a3f9b2c1d4e5...                            │
│                                              │
│  View on Stellar Expert →                   │
└──────────────────────────────────────────────┘
```
The hash links to `stellar.expert/explorer/testnet/tx/{hash}`.

**Failure**
```
┌──────────────────────────────────────────────┐
│  Transaction Failed                          │
│  op_underfunded                              │
└──────────────────────────────────────────────┘
```
Horizon error responses are JSON-parsed to surface the `result_codes.operations[0]` string directly. See [stellar-concepts.md](stellar-concepts.md#transaction-result-codes) for a full list of codes.

### Behavior Notes

- The Send button is disabled while `loading === true`.
- On success: form fields clear, `onSuccess()` fires (triggers balance refresh in parent).
- The full transaction flow — build → sign → submit — is documented in [architecture.md](architecture.md#4-send-xlm-transaction).

---

## `useFreighter` Hook

**File:** `src/hooks/useFreighter.ts`  
**Purpose:** Wraps `@stellar/freighter-api` into a React hook with loading state, error handling, and persistent disconnect.

### Returns

| Field | Type | Description |
|---|---|---|
| `isInstalled` | `boolean` | Freighter extension detected in browser |
| `isConnected` | `boolean` | User has granted site access |
| `publicKey` | `string \| null` | Connected wallet's G... address |
| `error` | `string \| null` | Last connection error message |
| `connecting` | `boolean` | True while `requestAccess` is in progress |
| `connect` | `() => Promise<string \| null>` | Opens Freighter popup; returns public key or null |
| `disconnect` | `() => void` | Clears state + sets `localStorage` flag to prevent auto-reconnect on reload |
| `signTransaction` | `(xdr: string) => Promise<string>` | Opens Freighter signing popup; returns signed XDR |

### Initialization Flow

```
Mount
  → isConnected()              is extension installed?
  → check localStorage flag    did user explicitly disconnect?
  → if installed AND no flag:
      getAddress()             already authorized? → auto-connect
  → setState accordingly
```

The `localStorage` key `stellar_dapp_disconnected` is set on `disconnect()` and removed on `connect()`. This ensures that after the user explicitly disconnects, a page reload does **not** reconnect them automatically — they must click **Connect Wallet** again.

> For the full disconnect-persistence design, see [architecture.md](architecture.md#key-design-decisions).

---

## `lib/stellar.ts` Utilities

**File:** `src/lib/stellar.ts`  
**Purpose:** Thin wrappers around `@stellar/stellar-sdk` — all Stellar network calls go through here.

| Export | Signature | Description |
|---|---|---|
| `TESTNET_URL` | `string` | `https://horizon-testnet.stellar.org` |
| `NETWORK_PASSPHRASE` | `string` | `Networks.TESTNET` — baked into every signed transaction |
| `server` | `Horizon.Server` | Pre-configured Horizon testnet client instance |
| `getXLMBalance` | `(publicKey: string) => Promise<string>` | Returns native XLM balance formatted to 7 decimal places |
| `buildSendXLMTransaction` | `(source, dest, amount, memo?) => Promise<string>` | Builds unsigned TX and returns XDR string |
| `submitTransaction` | `(signedXDR: string) => Promise<string>` | Submits signed XDR to Horizon; returns tx hash |
| `isValidStellarAddress` | `(address: string) => boolean` | Validates Ed25519 public key format |
| `truncateAddress` | `(address: string) => string` | Returns `GABCD...WXYZ` 6+6 display format |

> To understand why `buildSendXLMTransaction` must fetch the account before building, see [stellar-concepts.md](stellar-concepts.md#sequence-numbers).  
> For what XDR is and why it's used as the signing handoff format, see [stellar-concepts.md](stellar-concepts.md#xdr-external-data-representation).
