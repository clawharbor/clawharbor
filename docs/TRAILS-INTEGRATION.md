# Trails × clawharbor — Integration Guide

This integration adds three Trails-powered features to clawharbor's existing
Bankr payroll system:

1. **Fund Bankr Wallet** — Top up the operator's Bankr agent wallet from any
   token on any chain (Recipe 1 from the Trails skill).
2. **Cross-Chain Payroll** — Pay agents in USDC/ETH/BNKR/HARBOR on Base while
   funding the payment from Polygon, Arbitrum, Optimism, or Ethereum (Recipe 2).
3. **Yield Vaults** — Discover active Aave/Morpho pools and deposit through
   the Trails widget (Recipe 3, read-only discovery + widget hand-off).

All three keep clawharbor's existing security model: API keys are entered by
the user, stored only in `sessionStorage`, and forwarded per-request to the
proxy. Nothing is persisted server-side.

---

## What's in this drop

| File | Action | Purpose |
|---|---|---|
| `app/api/payroll/trails/route.ts` | **NEW** | Proxy for Trails RPC: `quote`, `execute`, `earn-pools` |
| `components/FundBankrWalletButton.tsx` | **NEW** | "Fund Wallet" button → builds Trails widget URL |
| `components/AgentYieldVault.tsx` | **NEW** | "Yield Vaults" button → lists Aave/Morpho pools |
| `components/AgentPayroll.tsx` | **MODIFIED** | Adds `'trails'` payment method with quote-then-confirm flow |
| `components/index.ts` | **MODIFIED** | Re-exports the new components |

No changes to `package.json` are required. The integration uses only `fetch`
(already in Next.js 15) and the existing Bankr `/agent/prompt` job-polling
pattern that's already in `app/api/payroll/bankr/route.ts`.

---

## Setup (one-time)

### 1. Get a Trails API key

Sign in at <https://sequence.build> and create a project. Copy the access
key — it goes in the browser session (never on the server).

### 2. Make sure the operator has a Bankr API key

Same key the existing payroll already uses. Format: `bk_…`. Get it at
<https://bankr.bot/api>. Required for:
- Fund Wallet (we look up the Bankr EVM wallet address)
- Cross-Chain Payroll (Bankr wallet broadcasts the deposit tx)
- Yield Vaults (only the Trails key is needed for discovery)

### 3. (Optional) Set environment defaults

For server-side defaults you can also add to `.env.local`, but they're not
required since keys come from the browser session:

```bash
# Optional — only used if you want to hard-set proxy defaults later
TRAILS_API=
BANKR_API_KEY=
```

---

## How to wire the new buttons into the UI

Drop them anywhere you already render `PayAgentButton`. Recommended places:

```tsx
import {
  PayAgentButton,
  FundBankrWalletButton,
  AgentYieldVaultButton,
} from '@/components';

// In your toolbar or settings panel
<div style={{ display: 'flex', gap: 8 }}>
  <PayAgentButton agents={agents} />
  <FundBankrWalletButton />
  <AgentYieldVaultButton />
</div>
```

---

## How each feature flows

### 1. Fund Bankr Wallet (`FundBankrWalletButton`)

```
User clicks button
  → Modal opens
  → User pastes Bankr key (or it's loaded from sessionStorage)
  → We call api.bankr.bot/agent/me to fetch their EVM wallet
  → User pastes Trails key
  → User picks destination preset (USDC/ETH on Base, USDC on Polygon)
  → We build https://demo.trails.build/?mode=swap&toAddress=…&toChainId=…
  → User clicks "Open Trails Widget" → signs in their own wallet
  → Funds arrive in Bankr wallet
```

**No on-chain code runs in clawharbor.** This is a pure URL builder. Zero new
dependencies.

### 2. Cross-Chain Payroll (modified `PayAgentModal`)

```
User selects "Trails" payment method
  → Enters Bankr key + Trails key
  → Picks source chain (Polygon / Arbitrum / Optimism / Ethereum)
  → Clicks "Quote Route"
  → POST /api/payroll/trails  { action: "quote", … }
       └─ Trails QuoteIntent → returns intent + depositTransaction
  → UI shows: "From: 10 USDC on Polygon → ≈ 0.0029 ETH on Base, ETA 2 min"
  → User clicks "Confirm & Send"
  → POST /api/payroll/trails  { action: "execute", intent, bankrApiKey, … }
       ├─ CommitIntent → returns intentId
       ├─ Bankr /agent/prompt to broadcast depositTransaction
       │     (uses the same job-polling pattern as /api/payroll/bankr)
       ├─ ExecuteIntent (notifies Trails the deposit landed)
       └─ WaitIntentReceipt (poll until cross-chain settles)
  → Success screen shows tx hash + intent id + Basescan link
```

> **Note on the Bankr submit step.** The Trails skill mentions importing
> `submit` from `@bankr/cli/dist/lib/api.js`. We deliberately don't use that
> here — it would add a new dependency and require the deposit signing key
> to be present at runtime. Instead, we use Bankr's existing `/agent/prompt`
> API (the same one that powers `/api/payroll/bankr`) and instruct Bankr to
> broadcast the exact `depositTransaction` returned by Trails. Same trust
> boundary; no new deps.

### 3. Yield Vaults (`AgentYieldVaultButton`)

```
User clicks button
  → Modal opens
  → User pastes Trails key
  → POST /api/payroll/trails  { action: "earn-pools", chainIds: [8453, 137] }
       └─ Trails GetEarnPools → list of active pools sorted by APY
  → UI lists Aave/Morpho pools with APY + TVL + chain
  → User filters by chain (Base/Polygon) and token (USDC/USDT/ETH/WETH)
  → "Deposit ↗" opens Trails widget with the pool's underlying token
       preselected. The widget handles approve + supply in user's wallet.
```

---

## Security model (unchanged)

clawharbor's existing payroll philosophy still holds:

- **Your key, your money, zero server storage.** API keys are entered in the
  browser, kept in `sessionStorage`, sent per-request to the proxy, used
  only for that request, never logged or persisted.
- **Same pattern, two keys.** Bankr key (`bk_…`) for signing transactions on
  the Bankr wallet. Trails key (Sequence access key) for routing/quoting.
- **No new secrets at rest.** No `.env` additions needed. No DB writes.
- **Browser-side validation.** Bankr keys validated by `bk_` prefix. Trails
  keys validated by non-empty string (Sequence doesn't have a fixed prefix).

---

## Testing checklist

Before merging:

- [ ] `npm run build` passes (no new TS errors)
- [ ] `npm run lint` passes
- [ ] Manual: open the modal with no keys → friendly key-input UI
- [ ] Manual: Fund Wallet → wallet address auto-populates from Bankr `me`
- [ ] Manual: Trails payroll → quote screen shows numbers, confirm sends tx
- [ ] Manual: Yield Vaults → pools render with APY/TVL after key set
- [ ] Manual: Refresh page → keys persist via sessionStorage
- [ ] Manual: Close tab → keys are gone (sessionStorage, not localStorage)

---

## What's NOT included (future work)

These were considered but skipped on purpose:

- **Auto-stake agent salaries to Aave/Morpho.** Would need to call `approve`
  + `supply` on the deposit address. That requires `@bankr/cli` + `viem` as
  new dependencies. Easier as a follow-up PR once the read-only discovery
  flow is validated.
- **`destinationToAddress` ≠ payer.** Already supported in the proxy (the
  `quote` action accepts it). The UI currently sends to the payer's wallet
  by default; trivial to expose later.
- **Achievement: "Yield Master".** Awarding XP/badges for staked salaries fits
  clawharbor's gamification — natural follow-up once auto-staking lands.
