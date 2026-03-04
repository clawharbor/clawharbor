export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

/**
 * Battle API — Generate agent debate arguments using Claude
 *
 * POST /api/demo/battle
 * Body: { topic, agent1: { name, role, position }, agent2: { name, role, position } }
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, agent1, agent2 } = body;

    if (!topic || !agent1 || !agent2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `You are generating a fun, short debate between two AI agents in a virtual office.

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

    const response = await fetch('https://llm.bankr.bot/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.BANKR_API_KEY || '',
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
    const text = data.content?.[0]?.text || '';

    // Parse JSON response
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Map agent names to actual IDs from the request
    // The hook will use agent names to match, so we keep agentId as the name for simplicity
    return NextResponse.json(parsed);

  } catch (error) {
    console.error('Battle API error:', error);
    // Return a fallback so the UI still works
    return NextResponse.json({ error: 'Failed to generate battle' }, { status: 500 });
  }
}
