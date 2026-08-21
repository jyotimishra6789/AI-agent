/**
 * GhostSOPAgent
 *
 * The core AI agent. Given a task name + domain, it:
 *   1. Plans the SOP structure (tool call: plan_sop)
 *   2. Generates each step with rich detail (tool call: write_steps)
 *   3. Adds quality gates and safety flags (tool call: add_checkpoints)
 *   4. Produces a final structured SOP object
 *
 * Uses Anthropic tool use (function calling) so every output is
 * typed and validated — never free-form hallucinated text.
 */

import anthropic from '../lib/anthropic.js';

// ── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'plan_sop',
    description:
      'Plan the high-level structure of a Standard Operating Procedure for a manufacturing task. Returns a list of step titles and estimated cycle time.',
    input_schema: {
      type: 'object',
      properties: {
        task_name: { type: 'string', description: 'The manufacturing task name' },
        domain: { type: 'string', description: 'Industry domain (e.g. Automotive, Pharma, Electronics)' },
        step_titles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ordered list of step titles for the SOP (6–10 steps)',
        },
        total_cycle_time_seconds: { type: 'number', description: 'Estimated total cycle time in seconds' },
        skill_level_required: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'expert'],
          description: 'Minimum skill level required to perform this task',
        },
      },
      required: ['task_name', 'domain', 'step_titles', 'total_cycle_time_seconds', 'skill_level_required'],
    },
  },
  {
    name: 'write_steps',
    description:
      'Write detailed instructions for each SOP step. Each step must include an action title, detailed instruction, and estimated duration.',
    input_schema: {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step_number: { type: 'number' },
              action: { type: 'string', description: 'Short imperative action title (max 8 words)' },
              instruction: {
                type: 'string',
                description: 'Detailed instruction with tolerances, tool names, and acceptance criteria',
              },
              duration_seconds: { type: 'number' },
              tools_required: { type: 'array', items: { type: 'string' } },
            },
            required: ['step_number', 'action', 'instruction', 'duration_seconds'],
          },
        },
      },
      required: ['steps'],
    },
  },
  {
    name: 'add_checkpoints',
    description:
      'Add quality checkpoints, safety flags, and regulatory tags to each step. Returns enriched steps.',
    input_schema: {
      type: 'object',
      properties: {
        enriched_steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step_number: { type: 'number' },
              quality_checkpoint: {
                type: 'string',
                description: 'Acceptance criteria or inspection criteria for this step (empty string if none)',
              },
              safety_flags: {
                type: 'array',
                items: { type: 'string' },
                description: 'PPE or safety requirements (e.g. "ESD wrist strap required")',
              },
              regulatory_tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Applicable regulatory standards (e.g. ISO 9001, GMP, OSHA)',
              },
              is_critical_step: {
                type: 'boolean',
                description: 'True if skipping this step risks product failure or safety incident',
              },
            },
            required: ['step_number', 'quality_checkpoint', 'safety_flags', 'regulatory_tags', 'is_critical_step'],
          },
        },
        overall_safety_rating: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Overall safety risk rating for the task',
        },
        compliance_standards: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of compliance standards that apply to this SOP',
        },
      },
      required: ['enriched_steps', 'overall_safety_rating', 'compliance_standards'],
    },
  },
];

// ── Agent Orchestrator ───────────────────────────────────────────────────────

export class GhostSOPAgent {
  constructor() {
    this.model = 'claude-opus-4-5';
  }

  /**
   * Main entry point. Runs the full agentic loop and streams progress events.
   * @param {string} taskName
   * @param {string} domain
   * @param {string} workerName
   * @param {function} onProgress  - callback({ stage, message, pct })
   * @returns {Promise<SOPDocument>}
   */
  async generateSOP(taskName, domain, workerName, onProgress = () => {}) {
    onProgress({ stage: 'init', message: 'Initialising Ghost SOP agent...', pct: 5 });

    const systemPrompt = `You are Ghost SOP — an elite manufacturing process documentation AI.
Your job is to generate world-class Standard Operating Procedures (SOPs) that are:
- Precise: include tolerances, tool names, part numbers, acceptance criteria
- Safe: always flag PPE, hazards, and critical steps
- Compliant: reference applicable standards (ISO 9001, GMP, OSHA, IPC-610, etc.)
- Actionable: written so a new hire can execute the task on day 1

You MUST use the provided tools in sequence:
1. First call plan_sop to define the structure
2. Then call write_steps with detailed instructions for every step
3. Finally call add_checkpoints to enrich with quality and safety data

Be extremely specific. Never write vague instructions like "check the part" — always specify what to check, what the pass/fail criteria are, and what to do on failure.`;

    const userMessage = `Generate a complete SOP for the following:
Task: ${taskName}
Industry Domain: ${domain}
${workerName ? `Operator: ${workerName}` : ''}

Use the tools in sequence to produce a fully structured, production-ready SOP.`;

    const messages = [{ role: 'user', content: userMessage }];

    let plan = null;
    let steps = null;
    let checkpoints = null;

    // ── Agentic Loop ─────────────────────────────────────────────────────────
    while (true) {
      onProgress({ stage: 'llm_call', message: `Calling AI model (${this.model})...`, pct: 20 });

      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      // Add assistant response to conversation
      messages.push({ role: 'assistant', content: response.content });

      // End condition
      if (response.stop_reason === 'end_turn') break;

      // Process tool calls
      if (response.stop_reason === 'tool_use') {
        const toolResults = [];

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;

          let result;

          if (block.name === 'plan_sop') {
            plan = block.input;
            onProgress({ stage: 'plan', message: `SOP structure planned: ${plan.step_titles.length} steps detected`, pct: 38 });
            result = { success: true, message: `Plan accepted. Now write detailed instructions for all ${plan.step_titles.length} steps.` };
          }

          else if (block.name === 'write_steps') {
            steps = block.input.steps;
            onProgress({ stage: 'steps', message: `${steps.length} steps written with instructions and timings`, pct: 65 });
            result = { success: true, message: `Steps written. Now add quality checkpoints, safety flags, and regulatory tags for each step.` };
          }

          else if (block.name === 'add_checkpoints') {
            checkpoints = block.input;
            onProgress({ stage: 'checkpoints', message: `Quality gates and safety flags added`, pct: 88 });
            result = { success: true, message: 'SOP generation complete.' };
          }

          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
        }

        messages.push({ role: 'user', content: toolResults });
      }

      // Safety: break if no tool calls and no end_turn
      if (response.stop_reason !== 'tool_use') break;
    }

    if (!plan || !steps || !checkpoints) {
      throw new Error('Agent did not complete all required tool calls. Try again.');
    }

    onProgress({ stage: 'assemble', message: 'Assembling final SOP document...', pct: 96 });

    return this._assemble(plan, steps, checkpoints, taskName, domain, workerName);
  }

  /**
   * Merges all tool outputs into a single clean SOP document.
   */
  _assemble(plan, steps, checkpoints, taskName, domain, workerName) {
    const enrichedMap = Object.fromEntries(
      checkpoints.enriched_steps.map((e) => [e.step_number, e])
    );

    const fullSteps = steps.map((s) => {
      const enriched = enrichedMap[s.step_number] || {};
      return {
        step_number: s.step_number,
        action: s.action,
        instruction: s.instruction,
        duration_seconds: s.duration_seconds,
        tools_required: s.tools_required || [],
        quality_checkpoint: enriched.quality_checkpoint || '',
        safety_flags: enriched.safety_flags || [],
        regulatory_tags: enriched.regulatory_tags || [],
        is_critical_step: enriched.is_critical_step || false,
      };
    });

    const qualitySteps = fullSteps.filter((s) => s.quality_checkpoint).length;

    return {
      id: crypto.randomUUID(),
      title: `${taskName} — Standard Operating Procedure`,
      task_name: taskName,
      domain,
      worker_name: workerName || null,
      revision: 'Rev 1.0',
      generated_at: new Date().toISOString(),
      skill_level_required: plan.skill_level_required,
      total_cycle_time_seconds: plan.total_cycle_time_seconds,
      overall_safety_rating: checkpoints.overall_safety_rating,
      compliance_standards: checkpoints.compliance_standards,
      step_count: fullSteps.length,
      quality_checkpoint_count: qualitySteps,
      steps: fullSteps,
    };
  }
}

// ── Deviation Detector ───────────────────────────────────────────────────────

export class DeviationDetector {
  /**
   * Compare a re-run (described in text) against a baseline SOP and
   * return a list of deviations using AI analysis.
   */
  async detect(baselineSOP, rerunDescription) {
    const prompt = `You are a manufacturing quality analyst. Compare the baseline SOP against the re-run description and identify deviations.

BASELINE SOP STEPS:
${baselineSOP.steps.map((s) => `Step ${s.step_number}: ${s.action} — ${s.instruction}`).join('\n')}

RE-RUN DESCRIPTION:
${rerunDescription}

Respond with a JSON array of deviation objects. Each object must have:
- step_number (number or null if not step-specific)
- deviation_type: "missed_step" | "wrong_order" | "timing_deviation" | "quality_failure" | "safety_violation"
- severity: "low" | "medium" | "high" | "critical"
- description: what went wrong
- recommendation: corrective action

Return ONLY valid JSON, no markdown.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const text = response.content[0].text.trim();
      return JSON.parse(text);
    } catch {
      return [];
    }
  }
}
