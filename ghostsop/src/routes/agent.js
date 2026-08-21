import { Router } from 'express';
import { z } from 'zod';
import { DeviationDetector } from '../agents/GhostSOPAgent.js';

const router = Router();
const sopStore = new Map(); // shared ref — in prod use a DB/cache layer

const DeviationSchema = z.object({
  baseline_sop: z.object({ steps: z.array(z.any()) }),
  rerun_description: z.string().min(10),
});

/**
 * POST /api/agent/detect-deviation
 * Analyses a re-run description against a baseline SOP.
 */
router.post('/detect-deviation', async (req, res) => {
  const parsed = DeviationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const detector = new DeviationDetector();
    const deviations = await detector.detect(parsed.data.baseline_sop, parsed.data.rerun_description);
    res.json({ deviations });
  } catch (err) {
    console.error('Deviation detection error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agent/analyze-task
 * Quick task analysis — returns domain, risk level, and suggested SOP length
 * before the full generation is kicked off.
 */
router.post('/analyze-task', async (req, res) => {
  const { task_name } = req.body;
  if (!task_name) return res.status(400).json({ error: 'task_name is required' });

  try {
    const { default: anthropic } = await import('../lib/anthropic.js');
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Analyze this manufacturing task and respond with ONLY valid JSON (no markdown):
Task: "${task_name}"
Return: { "domain": string, "risk_level": "low"|"medium"|"high"|"critical", "suggested_steps": number, "key_standards": string[] }`,
      }],
    });

    const text = response.content[0].text.trim();
    const analysis = JSON.parse(text);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
