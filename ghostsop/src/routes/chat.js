import { Router } from 'express';
import { z } from 'zod';
import anthropic from '../lib/anthropic.js';

const router = Router();

const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
  sop_context: z.any().optional(),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
});

const SYSTEM_PROMPT = `You are the Ghost SOP AI assistant — an expert in:
- Manufacturing process documentation (SOPs, work instructions, control plans)
- Lean manufacturing and Six Sigma
- ISO 9001, IATF 16949, GMP, FDA 21 CFR, OSHA, IPC-610
- PPE requirements and industrial safety
- Worker training and onboarding
- Root cause analysis and corrective actions (8D, 5-Why, Fishbone)

Be concise, specific, and actionable. Always reference specific standards when relevant.
If SOP context is provided, reference it directly in your answers.`;

/**
 * POST /api/chat
 * Non-streaming chat with optional SOP context.
 */
router.post('/', async (req, res) => {
  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { message, sop_context, history = [] } = parsed.data;

  const systemWithContext = sop_context
    ? `${SYSTEM_PROMPT}\n\nCURRENT SOP CONTEXT:\nTask: ${sop_context.task_name}\nDomain: ${sop_context.domain}\nSteps: ${sop_context.steps?.map((s) => `${s.step_number}. ${s.action}`).join(', ')}`
    : SYSTEM_PROMPT;

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemWithContext,
      messages,
    });

    res.json({
      message: response.content[0].text,
      usage: response.usage,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/chat/stream
 * Streaming chat response via SSE.
 */
router.post('/stream', async (req, res) => {
  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { message, sop_context, history = [] } = parsed.data;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const systemWithContext = sop_context
    ? `${SYSTEM_PROMPT}\n\nCURRENT SOP CONTEXT:\nTask: ${sop_context.task_name}\nDomain: ${sop_context.domain}`
    : SYSTEM_PROMPT;

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemWithContext,
      messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ delta: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

export default router;
