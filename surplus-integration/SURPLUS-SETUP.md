# Surplus Intelligence Integration

This integration adds **Surplus Intelligence** as an LLM fallback provider in clawharbor.
When Bankr is unavailable or its API key is not set, water cooler chat and agent battles
automatically switch to Surplus.

---

## Files to add / replace

```
clawharbor/
├── lib/
│   └── surplus-llm.ts          ← NEW: centralized Surplus API client
├── app/api/
│   ├── demo/battle/route.ts    ← REPLACE: adds Surplus fallback after Bankr
│   ├── office/
│   │   ├── chat/route.ts       ← REPLACE: adds Surplus fallback after openclaw
│   │   ├── battle/route.ts     ← NEW: battle endpoint for real (non-demo) mode
│   │   └── surplus/route.ts    ← NEW: status check endpoint
└── .env.local.example          ← REPLACE: adds SURPLUS_API_KEY
```

---

## Installation

### 1. Copy files into your project

```bash
# From the surplus-integration folder, copy into the clawharbor root:
cp lib/surplus-llm.ts              ../clawharbor/lib/
cp app/api/demo/battle/route.ts    ../clawharbor/app/api/demo/battle/
cp app/api/office/chat/route.ts    ../clawharbor/app/api/office/chat/
cp app/api/office/battle/route.ts  ../clawharbor/app/api/office/battle/
cp app/api/office/surplus/route.ts ../clawharbor/app/api/office/surplus/
cp .env.local.example              ../clawharbor/
```

### 2. Set the environment variable

Create `.env.local` in the clawharbor root if it does not exist yet:

```bash
cd clawharbor
cp .env.local.example .env.local
```

Edit `.env.local` and fill in `SURPLUS_API_KEY`:

```env
SURPLUS_API_KEY=sk-surplus-xxxxxxxxxxxxxxxx
```

Get your API key at: https://www.surplusintelligence.ai

### 3. Restart the server

```bash
npm run dev
```

---

## Verification

Check the Surplus connection with curl:

```bash
# GET — check configuration status
curl http://localhost:3333/api/office/surplus \
  -H "X-clawharbor-Token: $(cat ~/.openclaw/.clawharbor-token)"

# Expected response when configured:
# { "configured": true, "model": "claude-haiku-4-5-20251001" }

# POST — send a test ping to the Surplus API
curl -X POST http://localhost:3333/api/office/surplus \
  -H "X-clawharbor-Token: $(cat ~/.openclaw/.clawharbor-token)"

# Expected response on success:
# { "ok": true, "reply": "pong" }
```

---

## How the fallback works

### Water cooler chat (`/api/office/chat`)

```
POST /api/office/chat
      │
      ▼
openclaw binary available?
      │
      ├── yes  →  getAgentReply()  →  reply ✓
      │
      └── no / failed
              │
              ▼
          SURPLUS_API_KEY set?
              │
              ├── yes  →  getSurplusReply()  →  reply ✓
              │
              └── no   →  { success: false, error: "Agent did not respond" }
```

### Agent battle (`/api/demo/battle` and `/api/office/battle`)

```
POST /api/.../battle
      │
      ▼
BANKR_API_KEY set?
      │
      ├── yes  →  tryBankr()  →  success  →  return result
      │
      └── no / failed
              │
              ▼
          SURPLUS_API_KEY set?
              │
              ├── yes  →  trySurplus()  →  return result + { _provider: "surplus" }
              │
              └── no   →  { error: "no LLM provider available" }
```

---

## Available models

Default: `claude-haiku-4-5-20251001` (fast and cost-efficient)

Override via env var:
```env
SURPLUS_MODEL=claude-sonnet-4-6
```

Full model list: https://www.surplusintelligence.ai/docs/marketplace/models

---

## No breaking changes

- All existing API routes continue to work exactly as before
- Bankr remains the primary provider; Surplus is only a fallback
- If `SURPLUS_API_KEY` is not set, behavior is identical to the original
- Fully compatible with TypeScript strict mode
