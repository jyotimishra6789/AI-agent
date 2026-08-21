import { Router } from 'express';
import { z } from 'zod';
import { GhostSOPAgent } from '../agents/GhostSOPAgent.js';

const router = Router();

// In-memory store (replace with DB in production)
const sopStore = new Map();

const GenerateSchema = z.object({
  task_name: z.string().min(2).max(100),
  domain: z.string().min(2).max(80),
  worker_name: z.string().optional(),
});

/**
 * POST /api/sop/generate
 * Runs the full GhostSOPAgent agentic loop.
 * Streams progress via Server-Sent Events.
 */
router.post('/generate', async (req, res) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { task_name, domain, worker_name } = parsed.data;

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const agent = new GhostSOPAgent();

    const sop = await agent.generateSOP(task_name, domain, worker_name, (progress) => {
      send('progress', progress);
    });

    sopStore.set(sop.id, sop);

    send('complete', { sop });
    res.end();
  } catch (err) {
    console.error('SOP generation error:', err);
    send('error', { message: err.message });
    res.end();
  }
});

/**
 * GET /api/sop/:id
 */
router.get('/:id', (req, res) => {
  const sop = sopStore.get(req.params.id);
  if (!sop) return res.status(404).json({ error: 'SOP not found' });
  res.json(sop);
});

/**
 * GET /api/sop
 * List all stored SOPs (summary only)
 */
router.get('/', (_req, res) => {
  const list = [...sopStore.values()].map(({ id, title, task_name, domain, generated_at, step_count }) => ({
    id, title, task_name, domain, generated_at, step_count,
  }));
  res.json(list.reverse());
});

/**
 * DELETE /api/sop/:id
 */
router.delete('/:id', (req, res) => {
  if (!sopStore.has(req.params.id)) return res.status(404).json({ error: 'SOP not found' });
  sopStore.delete(req.params.id);
  res.json({ success: true });
});

export default router;
