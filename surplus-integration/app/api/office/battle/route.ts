export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { surplusChat, isSurplusConfigured } from '../../../../lib/surplus-llm';

/**
 * Office Battle API (authenticated, non-demo)
 *
 * POST /api/office/battle
 * Headers: X-clawharbor-Token
 * Body: { topic, agent1: { name, role, position }, agent2: { name, role, position } }
 *
 * Provider priority:
 *   1. Bankr LLM  (requires BANKR_API_KEY env var)
 *   2. Surplus Intelligence  (requires SURPLUS_API_KEY env var)
 */

function buildPrompt(
  topic: string,
  agent1: { name: string; role: string; position: string },
  agent2: { name: string; role: string; position: string },
): string {
  return `You are generating a fun, short debate between two AI agents in a virtual office.

Topic: "${topic}"
Agent 1: ${agent1.name} (${agent1.role}) — Position: ${agent1.position}
Agent 2: ${agent2.name} (${agent2.role}) — Position: ${agent2.position}

Generate exactly 4 debate arguments (2 per agent, 2 rounds):
- Round 1: Each agent makes their opening argument
- Round 2: Each agent rebuts the other

Rules:
- Each argument is 1-2 sentences max, punchy and opinionated
- Keep it funny, slightly absurd, but makes a real point
- Agent personalities: ${agent1.name} is confident, ${agent2.name} is data-driven
- No profanity, keep it workplace-appropriate
- Format as JSON with this exact structure:

{
  "arguments": [
    { "agentId": "${agent1.name.toLowerCase()}", "agentName": "${agent1.name}", "argument": "...", "round": 1 },
    { "agentId": "${agent2.name.toLowerCase()}", "agentName": "${agent2.name}", "argument": "...", "round": 1 },
    { "agentId": "${agent1.name.toLowerCase()}", "agentName": "${agent1.name}", "argument": "...", "round": 2 },
    { "agentId": "${agent2.name.toLowerCase()}", "agentName": "${agent2.name}", "argument": "...", "round": 2 }
  ]
}

Return ONLY the JSON, nothing else.`;
}

function parseArguments(text: string): unknown {
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function tryBankr(prompt: string): Promise<string> {
  const apiKey = process.env.BANKR_API_KEY;
  if (!apiKey) {
    throw new Error('BANKR_API_KEY not configured');
  }

  const response = await fetch('https://llm.bankr.bot/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      model: 'gemini-flash',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Bankr API error: ${response.status}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text || '';
  if (!text) {
    throw new Error('Bankr returned empty content');
  }
  return text;
}

async function trySurplus(prompt: string): Promise<string> {
  return surplusChat(
    [{ role: 'user', content: prompt }],
    { max_tokens: 1000 },
  );
}

export async function POST(request: Request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { topic, agent1, agent2 } = body as {
      topic?: string;
      agent1?: { name: string; role: string; position: string };
      agent2?: { name: string; role: string; position: string };
    };

    if (!topic || !agent1 || !agent2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const prompt = buildPrompt(topic, agent1, agent2);

    // Try Bankr first, then Surplus as fallback
    let rawText: string | null = null;
    let usedProvider = 'none';

    try {
      rawText = await tryBankr(prompt);
      usedProvider = 'bankr';
    } catch (bankrErr) {
      console.warn('[office/battle] Bankr failed, trying Surplus:', (bankrErr as Error).message);

      if (isSurplusConfigured()) {
        try {
          rawText = await trySurplus(prompt);
          usedProvider = 'surplus';
        } catch (surplusErr) {
          console.error('[office/battle] Surplus also failed:', (surplusErr as Error).message);
        }
      }
    }

    if (!rawText) {
      return NextResponse.json(
        { error: 'Failed to generate battle — no LLM provider available' },
        { status: 500 },
      );
    }

    const parsed = parseArguments(rawText);

    return NextResponse.json({ ...parsed as object, _provider: usedProvider });
  } catch (error) {
    console.error('[office/battle] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to generate battle' },
      { status: 500 },
    );
  }
}
