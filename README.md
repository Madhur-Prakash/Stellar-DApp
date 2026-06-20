<div align="center">

# Stellar Pay

### Level 1 – White Belt dApp · Stellar Testnet

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-7c3aed)](https://stellar.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e)](LICENSE)

A minimal XLM payment dApp — connect your Freighter wallet, check your balance, and send XLM on the Stellar Testnet.  
No backend. No API keys. Fully client-side.

**[Live Demo](#) · [Documentation](docs/) · [Report Issue](../../issues)**

</div>

---

## Project Description

Stellar Pay is a browser-based dApp that demonstrates the core building blocks of Stellar development:

- **Wallet connection** — integrates with the [Freighter](https://freighter.app) browser extension to connect and disconnect a Stellar account
- **Balance display** — fetches the connected wallet's live XLM balance from the Stellar Testnet via Horizon API
- **XLM transactions** — builds, signs (via Freighter), and submits native XLM payments on testnet with real-time feedback
- **Error handling** — surfaces Horizon result codes (`op_underfunded`, `op_no_destination`, etc.) in plain language

All blockchain operations happen directly in the browser — the app calls Stellar's public Horizon testnet API with zero server infrastructure.

---

## Level 1 Requirements Coverage

| Requirement | Implementation |
|---|---|
| Freighter wallet setup | Detects extension, prompts install if missing |
| Stellar Testnet | Hardcoded to `horizon-testnet.stellar.org` + testnet passphrase |
| Wallet connect | `WalletPanel` → Freighter `requestAccess()` + `getAddress()` |
| Wallet disconnect | Clears session, persists across reloads via `localStorage` |
| Fetch XLM balance | `BalanceCard` → Horizon `GET /accounts/{key}`, refreshable |
| Display balance in UI | Large numeric display with 7 decimal places + refresh button |
| Send XLM transaction | `SendForm` → build TX → Freighter sign → Horizon submit |
| Transaction hash | Displayed on success with link to Stellar Expert explorer |
| Success / failure state | Green success panel or red error panel with Horizon result code |
| Error handling | Input validation, Horizon error parsing, Freighter rejection handling |

---

## Screenshots

> Add your screenshots here before submitting. Required by the checklist:

### Wallet Connected State
*(screenshot showing the green connected card with truncated address and Disconnect button)*
<img width="923" height="922" alt="Screenshot 2026-06-20 165236" src="https://github.com/user-attachments/assets/6c7128f7-fe83-4cbd-8ae4-1640be89c84b" />

### Balance Displayed
*(screenshot showing the XLM balance card with your testnet balance)*
<img width="923" height="922" alt="Screenshot 2026-06-20 165236" src="https://github.com/user-attachments/assets/9d1aae3b-b1f9-402d-9fcb-40dda139b990" />

### Successful Testnet Transaction
*(screenshot showing the green success panel with transaction hash)*
<img width="732" height="938" alt="Screenshot 2026-06-20 165323" src="https://github.com/user-attachments/assets/6b8a0bfa-4745-41d8-bd03-184f224fe465" />

### Transaction Result Shown to User
*(screenshot showing the "View on Stellar Expert →" link with the confirmed hash)*
<img width="1716" height="716" alt="Screenshot 2026-06-20 165434" src="https://github.com/user-attachments/assets/aa855c5f-09ad-4322-954c-c117b78e596f" />


---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) — App Router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Wallet | [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api) |
| Blockchain | [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) |
| Network | Stellar Testnet via `horizon-testnet.stellar.org` |

---

## Setup Instructions

### Prerequisites

| Requirement | Notes |
|---|---|
| [Node.js 18+](https://nodejs.org) | Required to run Next.js |
| [Freighter Wallet](https://freighter.app) | Browser extension — Chrome or Firefox |

After installing Freighter, open it → **Settings → Network → Test SDF Network**.

### 1. Clone & Install

```bash
git clone https://github.com/your-username/stellar-dapp.git
cd stellar-dapp
npm install
```

### 2. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Fund Your Testnet Wallet

Your testnet wallet starts with zero XLM. Get free test XLM from the faucet:

1. Open Freighter and copy your public key (`G...` address)
2. Go to [laboratory.stellar.org/account-creator?network=testnet](https://laboratory.stellar.org/account-creator?network=testnet)
3. Paste your key and click **Create account** — you'll receive **10,000 testnet XLM** instantly

> See [docs/setup.md](docs/setup.md) for full setup, deployment, and troubleshooting details.

---

## Project Structure

```
stellar-dapp/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, metadata
│   │   └── page.tsx            # Main page — state orchestration
│   ├── components/
│   │   ├── WalletPanel.tsx     # Wallet connect / disconnect UI
│   │   ├── BalanceCard.tsx     # Live XLM balance display
│   │   └── SendForm.tsx        # Send XLM form + transaction result
│   ├── hooks/
│   │   └── useFreighter.ts     # Freighter wallet React hook
│   └── lib/
│       └── stellar.ts          # Stellar SDK utilities
docs/
├── architecture.md             # System design & full data flow
├── components.md               # Component API reference
├── stellar-concepts.md         # Stellar / Horizon explainer
└── setup.md                    # Local dev + deployment guide
README.md
```

---

## Documentation

| Doc | What it covers |
|---|---|
| [Architecture](docs/architecture.md) | System diagram, data flow for connect / balance / send, design decisions |
| [Components](docs/components.md) | Props, state, render states, and behavior for every component and hook |
| [Stellar Concepts](docs/stellar-concepts.md) | Horizon, XDR, network passphrase, testnet, Freighter API explained |
| [Setup Guide](docs/setup.md) | Local dev, scripts, mainnet migration, Vercel/Netlify deployment, troubleshooting |

---

## How It Works (30-second summary)

```
1. Connect   →  Freighter popup → returns G... public key
2. Balance   →  GET horizon-testnet.stellar.org/accounts/{key} → native XLM balance
3. Send      →  Build TX (stellar-sdk) → sign (Freighter) → POST /transactions
4. Result    →  Success: tx hash + Stellar Expert link | Failure: Horizon result code
```

The wallet "disconnect" persists across page reloads via `localStorage` — reloading the page won't reconnect until the user clicks **Connect Wallet** again.

---

## Security

- Your **private key never leaves Freighter** — the app only handles signed XDR blobs
- All calls go to Stellar's official public Horizon testnet server
- No API keys, no `.env` file, no secrets anywhere in the code

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
