const BASE = '/api';

/**
 * Generate a SOP via SSE stream.
 * Calls onProgress(event) for each progress update.
 * Resolves with the final SOP document when complete.
 */
export function generateSOP({ task_name, domain, worker_name }, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(`${BASE}/sop/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_name, domain, worker_name }),
      });

      if (!res.ok) {
        const err = await res.json();
        return reject(new Error(err.error || 'Generation failed'));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // handled below with data
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.sop) resolve(data.sop);
              else if (data.message && data.stage !== undefined) {
                // error event
                reject(new Error(data.message));
              } else {
                onProgress(data);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      reject(err);
    }
  });
}

export async function listSOPs() {
  const res = await fetch(`${BASE}/sop`);
  if (!res.ok) throw new Error('Failed to fetch SOPs');
  return res.json();
}

export async function getSOPById(id) {
  const res = await fetch(`${BASE}/sop/${id}`);
  if (!res.ok) throw new Error('SOP not found');
  return res.json();
}

export async function deleteSOP(id) {
  const res = await fetch(`${BASE}/sop/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete SOP');
  return res.json();
}

export async function detectDeviation(baseline_sop, rerun_description) {
  const res = await fetch(`${BASE}/agent/detect-deviation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseline_sop, rerun_description }),
  });
  if (!res.ok) throw new Error('Deviation detection failed');
  return res.json();
}

export async function analyzeTask(task_name) {
  const res = await fetch(`${BASE}/agent/analyze-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_name }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function sendChatMessage(message, sop_context = null, history = []) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sop_context, history }),
  });
  if (!res.ok) throw new Error('Chat failed');
  return res.json();
}

/** Stream chat response, calling onDelta(text) for each chunk */
export async function streamChatMessage(message, sop_context = null, history = [], onDelta) {
  const res = await fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sop_context, history }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6);
        if (raw === '[DONE]') return fullText;
        try {
          const data = JSON.parse(raw);
          if (data.delta) {
            fullText += data.delta;
            onDelta(data.delta, fullText);
          }
        } catch {}
      }
    }
  }
  return fullText;
}