<div align="center">

# 🚀 Stellar Pay

### A minimal XLM payment dApp on the Stellar Testnet

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-7c3aed?logo=stellar)](https://stellar.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**[Live Demo](#) · [Report Bug](../../issues) · [Request Feature](../../issues)**

</div>

---

## ✨ Overview

Stellar Pay lets you connect a [Freighter](https://freighter.app) browser wallet, check your XLM balance, and send XLM payments — all on the Stellar Testnet. No backend, no API keys, no gas fees.

> Built for **Stellar dApp Level 1 – White Belt** challenge.

---

## 📸 Screenshots

| Wallet Connect | Balance + Send | Transaction Result |
|---|---|---|
| *(add screenshot)* | *(add screenshot)* | *(add screenshot)* |

---

## ⚡ Features

| Feature | Details |
|---|---|
| **Wallet Connect** | One-click Freighter wallet connection |
| **Wallet Disconnect** | Clean session disconnect |
| **Live XLM Balance** | Fetched from Horizon Testnet, refreshable |
| **Send XLM** | To any valid Stellar address with optional memo |
| **Transaction Feedback** | Success hash + Stellar Expert link, or error detail |
| **Input Validation** | Real-time address and amount validation |
| **Testnet Faucet Link** | Direct link to fund your wallet |

---

## 🏗️ Architecture

```
Browser
  └── Next.js App (App Router)
        ├── WalletPanel      ← Freighter connect/disconnect
        ├── BalanceCard      ← Horizon GET /accounts/{key}
        └── SendForm         ← Build TX → Sign (Freighter) → Submit to Horizon
              │
              └── lib/stellar.ts  ← Stellar SDK utilities
              └── hooks/useFreighter.ts  ← Freighter API wrapper
```

The app is **fully client-side**. All blockchain calls go directly from the browser to `horizon-testnet.stellar.org`.

> See [docs/architecture.md](docs/architecture.md) for the full data flow diagram.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) — App Router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Wallet | [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api) |
| Blockchain | [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) |
| Network | Stellar Testnet via `horizon-testnet.stellar.org` |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org)
- **Freighter Wallet** browser extension — [Install](https://freighter.app)
  - After installing, open Freighter → Settings → Change network to **Testnet**

### 1. Clone & Install

```bash
git clone https://github.com/your-username/stellar-dapp.git
cd stellar-dapp
npm install
```

### 2. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Fund Your Testnet Wallet

Your testnet wallet starts empty. Get free test XLM:

👉 [Stellar Laboratory — Account Creator](https://laboratory.stellar.org/account-creator?network=testnet)

Paste your Freighter public key and click **Create account** to receive **10,000 XLM**.

---

## 📁 Project Structure

```
stellar-dapp/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, metadata
│   │   ├── page.tsx            # Main page, state orchestration
│   │   └── globals.css         # Tailwind base styles
│   ├── components/
│   │   ├── WalletPanel.tsx     # Connect / disconnect UI
│   │   ├── BalanceCard.tsx     # Live XLM balance display
│   │   └── SendForm.tsx        # Send XLM form + tx result
│   ├── hooks/
│   │   └── useFreighter.ts     # Freighter wallet state hook
│   └── lib/
│       └── stellar.ts          # Stellar SDK utilities
├── docs/
│   ├── architecture.md         # System design & data flow
│   ├── components.md           # Component API reference
│   ├── stellar-concepts.md     # Stellar / Horizon explainer
│   └── setup.md                # Detailed setup & deployment guide
├── README.md
└── package.json
```

---

## 📖 Documentation

| Doc | Description |
|---|---|
| [Architecture](docs/architecture.md) | System design, data flow, component tree |
| [Components](docs/components.md) | Props, state, and behavior for each component |
| [Stellar Concepts](docs/stellar-concepts.md) | Horizon, XDR, network passphrase, testnet explained |
| [Setup Guide](docs/setup.md) | Local dev, env config, and deployment to Vercel |

---

## 🧪 How Testnet Works

- **No real money** — testnet XLM has zero value
- **Free faucet** — get 10,000 XLM instantly via Stellar Lab
- **Same SDK** — identical API to mainnet, just a different passphrase
- **Public explorer** — view all transactions at [stellar.expert/explorer/testnet](https://stellar.expert/explorer/testnet)

---

## 🔐 Security Notes

- Your **private key never leaves Freighter** — the app only sees a signed XDR blob
- All calls go to Stellar's official public Horizon server
- No API keys, no secrets, nothing stored in `.env`

---

## 📜 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
Built with the <a href="https://stellar.org">Stellar SDK</a> · Powered by <a href="https://freighter.app">Freighter</a>
</div>
