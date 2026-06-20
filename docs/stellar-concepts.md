# Stellar Concepts

> **Navigation:** [← README](../README.md) · [Architecture](architecture.md) · [Components](components.md) · [Setup Guide](setup.md)

A plain-English explainer for every Stellar-specific concept used in this project. No blockchain background assumed.

---

## The Stellar Network

Stellar is a public blockchain network designed for fast, low-cost payments. Unlike Ethereum, it is **not** a general smart-contract platform — it specializes in asset transfers and payments.

Key facts:
- Transactions confirm in **3–5 seconds**
- Fees are ~**0.00001 XLM** per operation (tiny)
- The native currency is **XLM** (Lumens)
- Accounts require a **minimum balance of 1 XLM** to exist — see [Minimum Account Balance](#minimum-account-balance)

---

## Testnet vs. Mainnet

This app is hardcoded to **testnet only**. Here's how they differ:

| | Testnet | Mainnet |
|---|---|---|
| Purpose | Development and testing | Real transactions |
| XLM value | Zero (free from faucet) | Real money |
| Network passphrase | `Test SDF Network ; September 2015` | `Public Global Stellar Network ; September 2015` |
| Horizon URL | `horizon-testnet.stellar.org` | `horizon.stellar.org` |
| Explorer | `stellar.expert/explorer/testnet` | `stellar.expert/explorer/public` |
| Wiped periodically | Yes | No |

To switch to mainnet, you must change `TESTNET_URL` and `NETWORK_PASSPHRASE` in `src/lib/stellar.ts`, and update the Freighter signing passphrase in `useFreighter.ts`. Full instructions in [setup.md → Switching to Mainnet](setup.md#switching-to-mainnet).

---

## Horizon API

**Horizon** is Stellar's REST API layer. It sits between your app and the raw peer-to-peer network.

```
Your App  →  Horizon  →  Stellar Network
```

Horizon calls used by this app:

| Call | What it does |
|---|---|
| `GET /accounts/{publicKey}` | Fetches account data including all balances |
| `POST /transactions` | Submits a signed transaction to the network |

The Stellar Foundation runs two public Horizon instances:
- `https://horizon-testnet.stellar.org` — testnet (used by this app)
- `https://horizon.stellar.org` — mainnet

**No API key required.** All Horizon calls are made directly from the browser (CORS is enabled). This is why the app needs no backend server. See [architecture.md](architecture.md#overview) for the full system diagram.

---

## Accounts and Public Keys

Every Stellar account has two keys:

| Key | Starts with | Length | Purpose |
|---|---|---|---|
| Public key | `G` | 56 chars | Your "address" — safe to share |
| Private key | `S` | 56 chars | Signs transactions — **never share** |

Example public key:
```
GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3VRZHCW5S
```

**Freighter stores your private key** in its encrypted browser vault. The app never sees the private key — only the signed transaction output. This is enforced by the [XDR signing flow](#xdr-external-data-representation).

---

## XDR (External Data Representation)

XDR is Stellar's binary serialization format for transactions. You'll see it as a base64-encoded string like:

```
AAAAAgAAAAA...AAAAAAAAAAAAAAA==
```

The signing flow used in `SendForm` → `lib/stellar.ts` → `useFreighter.ts`:

```
1. stellar-sdk builds a Transaction object
2. .toXDR()          →  unsigned XDR base64 string
3. passed to Freighter
4. Freighter decodes it, shows human-readable details in its popup
5. user approves
6. Freighter signs with private key  →  signed XDR string
7. app submits signed XDR to Horizon POST /transactions
```

The unsigned XDR is not sensitive. The signed XDR is safe to submit because it can only move funds from the account whose private key signed it.

> The component that coordinates this flow is `SendForm` — see [components.md → SendForm](components.md#sendform) for its props and state.

---

## Network Passphrase

Every Stellar transaction includes the **network passphrase** as part of the signed data. This prevents replay attacks across networks.

```
Testnet:  "Test SDF Network ; September 2015"
Mainnet:  "Public Global Stellar Network ; September 2015"
```

A transaction signed with the testnet passphrase is cryptographically invalid on mainnet and vice versa.

In this app, the passphrase is set in two places and must match:
1. `lib/stellar.ts` → `NETWORK_PASSPHRASE = Networks.TESTNET` (used when building the TX)
2. `hooks/useFreighter.ts` → `signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" })` (used when signing)

---

## Sequence Numbers

Every Stellar account has a **sequence number** that increments with each transaction. A submitted transaction must include `currentSequence + 1` or Horizon rejects it with `tx_bad_seq`.

This is why `buildSendXLMTransaction` in `lib/stellar.ts` calls `server.loadAccount(sourcePublicKey)` before building — it fetches the live sequence number from Horizon so the transaction is always valid.

---

## Minimum Account Balance

Stellar accounts must maintain a minimum balance to remain active. The formula:

```
minimum = (2 + numSubentries) × 0.5 XLM
```

For a basic account with no extra entries: **2 × 0.5 = 1 XLM minimum**.

If you try to send an amount that would drop your balance below this reserve, the transaction fails with `op_underfunded`. The `SendForm` will display this error code. See the [full list of result codes](#transaction-result-codes) below.

Accounts that have never received XLM don't exist on the network at all — which is why `BalanceCard` may show "Account not found" until you fund via the [Stellar Laboratory faucet](https://laboratory.stellar.org/account-creator?network=testnet).

---

## Freighter Wallet

[Freighter](https://freighter.app) is a browser extension wallet for Stellar, maintained by the Stellar Development Foundation. The app uses `@stellar/freighter-api` to communicate with it.

Key API methods used in [`useFreighter.ts`](components.md#usefreighter-hook):

| Method | What it does |
|---|---|
| `isConnected()` | Returns `{ isConnected: boolean }` — whether the extension is installed |
| `getAddress()` | Returns `{ address: string }` — the current account if already authorized |
| `requestAccess()` | Shows the "Allow this site?" permission popup |
| `signTransaction(xdr, opts)` | Shows the transaction review popup; returns `{ signedTxXdr: string }` |

**Important:** Freighter has **no revoke-access API**. When the user clicks "Disconnect" in this app, we can only clear local React state and set a `localStorage` flag. Freighter still considers the site authorized — clicking "Connect Wallet" again will reconnect instantly without a new permission popup.

> See [architecture.md → Wallet Disconnect](architecture.md#2-wallet-disconnect) for how the `localStorage` flag prevents auto-reconnect on page reload.

---

## Transaction Result Codes

When a transaction fails, Horizon returns error details in `extras.result_codes`. The `SendForm` parses `result_codes.operations[0]` and displays it directly.

| Code | Meaning |
|---|---|
| `op_underfunded` | Not enough XLM to cover the send amount + minimum reserve |
| `op_no_destination` | Destination account doesn't exist on the network (never funded) |
| `op_low_reserve` | This transaction would create a new account below the minimum balance |
| `tx_bad_seq` | Sequence number mismatch — another transaction was submitted concurrently |
| `tx_insufficient_fee` | Transaction fee too low (rare on testnet) |
| `tx_bad_auth` | Transaction signature is invalid (wrong private key or network) |

For all Horizon error codes, see the [Stellar Horizon error reference](https://developers.stellar.org/docs/data/horizon/api-reference/errors/result-codes).
