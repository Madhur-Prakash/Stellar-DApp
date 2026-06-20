# Setup Guide

> **Navigation:** [← README](../README.md) · [Architecture](architecture.md) · [Components](components.md) · [Stellar Concepts](stellar-concepts.md)

Complete instructions for running Stellar Pay locally, configuring it, and deploying to production.

---

## Local Development

### 1. Prerequisites

| Requirement | Version | Install |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Included with Node |
| Freighter Wallet | Latest | [freighter.app](https://freighter.app) |

After installing Freighter:
1. Click the Freighter icon in your browser toolbar
2. Go to **Settings → Network**
3. Select **Test SDF Network** (Testnet)

> Freighter's network setting must match the app's `NETWORK_PASSPHRASE` in `src/lib/stellar.ts`. See [stellar-concepts.md → Network Passphrase](stellar-concepts.md#network-passphrase).

### 2. Install Dependencies

```bash
git clone https://github.com/your-username/stellar-dapp.git
cd stellar-dapp
npm install
```

### 3. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Hot reload is enabled — any change to `src/` reflects immediately.

### 4. Fund Your Testnet Wallet

Your Freighter account starts with zero balance on testnet. Get free test XLM:

**Option A — Stellar Laboratory (recommended)**
1. Open Freighter, copy your public key (`G...`)
2. Go to [laboratory.stellar.org/account-creator?network=testnet](https://laboratory.stellar.org/account-creator?network=testnet)
3. Paste your public key → **Create account** → receive **10,000 testnet XLM** instantly

**Option B — Friendbot API**
```bash
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

> Why do you need a minimum balance? See [stellar-concepts.md → Minimum Account Balance](stellar-concepts.md#minimum-account-balance).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server at localhost:3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript type check without emitting files |

---

## Environment Variables

This project has **no required environment variables**. Everything connects to Stellar's public Horizon testnet directly from the browser.

If you need a custom Horizon instance (e.g. a local node via `stellar/quickstart`), edit `src/lib/stellar.ts`:

```ts
export const TESTNET_URL = "https://horizon-testnet.stellar.org"; // ← change this
export const NETWORK_PASSPHRASE = Networks.TESTNET;               // ← and this
```

---

## Switching to Mainnet

> ⚠️ Only do this when you're ready to handle real money. Test thoroughly on testnet first.

**Step 1** — `src/lib/stellar.ts`:
```ts
// testnet (current)
export const TESTNET_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

// mainnet
export const TESTNET_URL = "https://horizon.stellar.org";
export const NETWORK_PASSPHRASE = Networks.PUBLIC;
```

**Step 2** — `src/hooks/useFreighter.ts`, in `signTransaction`:
```ts
// testnet (current)
networkPassphrase: "Test SDF Network ; September 2015",

// mainnet
networkPassphrase: "Public Global Stellar Network ; September 2015",
```

**Step 3** — `src/components/SendForm.tsx`, the explorer link:
```ts
// testnet (current)
`https://stellar.expert/explorer/testnet/tx/${result.hash}`

// mainnet
`https://stellar.expert/explorer/public/tx/${result.hash}`
```

**Step 4** — Switch Freighter to **Main Network** in its extension settings.

> See [stellar-concepts.md → Testnet vs. Mainnet](stellar-concepts.md#testnet-vs-mainnet) for the full comparison.

---

## Deployment

### Vercel (recommended)

Zero-config for Next.js. Your app will be live at `https://your-project.vercel.app`.

**Option A — Vercel CLI**
```bash
npm install -g vercel
vercel
```

**Option B — GitHub integration**
1. Push this repo to GitHub (must be **public** for the Level 1 challenge submission)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repo → **Deploy** — no settings required

### Netlify

```bash
npm run build
# Drag the .next/ folder to app.netlify.com/drop
# or: netlify deploy --prod --dir=.next
```

### GitHub Pages

GitHub Pages doesn't support Next.js dynamic routes natively. Add static export to `next.config.ts`:

```ts
const nextConfig = {
  output: "export",
  trailingSlash: true,
};
```

Then build and push the `out/` folder to the `gh-pages` branch.

---

## Project Dependencies

### Production

| Package | Purpose |
|---|---|
| `next` | Framework — App Router, routing, metadata |
| `react` / `react-dom` | UI rendering |
| `@stellar/stellar-sdk` | Transaction building, Horizon client, key validation |
| `@stellar/freighter-api` | Freighter browser extension API |

### Development

| Package | Purpose |
|---|---|
| `typescript` | Static typing |
| `tailwindcss` | Utility-first CSS |
| `eslint` | Linting |
| `@types/react` | React type definitions |

---

## Troubleshooting

**"Freighter wallet not detected"**
- Install the [Freighter extension](https://freighter.app) and refresh the page
- Supported browsers: Chrome, Brave, Firefox, Edge

**"Account not found" on balance load**
- The account has never been funded — use the [faucet](#4-fund-your-testnet-wallet)
- Check that Freighter is set to **Testnet**, not Mainnet

**Wallet re-connects after I disconnected and reloaded**
- This was a bug in earlier versions — it's now fixed via `localStorage` persistence
- If it still happens, open DevTools → Application → Local Storage → delete `stellar_dapp_disconnected` key and reconnect, then disconnect again

**Transaction fails with `op_no_destination`**
- The recipient address doesn't exist on testnet (never funded)
- The recipient needs to create their account first; direct them to the faucet

**Transaction fails with `op_underfunded`**
- Your balance would drop below the 1 XLM minimum reserve after the send
- Reduce the send amount or top up via faucet
- See [stellar-concepts.md → Minimum Account Balance](stellar-concepts.md#minimum-account-balance)

**Freighter signing popup doesn't appear**
- Make sure Freighter is unlocked (enter your password if prompted)
- Check the extension isn't blocked by your browser's popup blocker
- Try clicking the Freighter icon to verify it's active

**TypeScript errors after pulling**
```bash
npm install       # update dependencies
npx tsc --noEmit  # check types
```

**Build fails with `Module not found`**
```bash
rm -rf node_modules .next
npm install
npm run build
```
