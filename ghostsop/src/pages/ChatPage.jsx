import React, { useState, useRef, useEffect } from 'react';
import { streamChatMessage } from '../lib/api.js';

const QUICK_PROMPTS = [
  { label: 'PPE requirements',     text: 'What PPE is required for this task? List all protective equipment.' },
  { label: 'ISO 9001 compliance',  text: 'Review this SOP for ISO 9001 compliance gaps and suggest improvements.' },
  { label: 'Training plan',        text: 'Create a structured training plan for a new hire using this SOP.' },
  { label: 'Risk assessment',      text: 'Perform a risk assessment for this task and rate each step by hazard level.' },
  { label: 'Hindi translation',    text: 'Translate this SOP into Hindi for factory floor workers.' },
  { label: 'Corrective actions',   text: 'What corrective actions should be taken if a worker skips a quality checkpoint?' },
];

export default function ChatPage({ sop }) {
  const [messages, setMessages]   = useState([
    {
      role: 'assistant',
      content: sop
        ? `Ghost SOP assistant ready. I have full context of your **${sop.task_name}** SOP (${sop.step_count} steps, ${sop.quality_checkpoint_count} quality gates). Ask me anything — compliance review, safety analysis, training plan, or translations.`
        : 'Ghost SOP assistant ready. Generate a SOP first to unlock context-aware answers, or ask me general manufacturing questions.',
    },
  ]);
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef                 = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    setInput('');

    const history = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setStreaming(true);

    // placeholder for streaming
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      await streamChatMessage(msg, sop || null, history, (_delta, full) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: full, streaming: true };
          return updated;
        });
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: `Error: ${err.message}`, error: true };
        return updated;
      });
    } finally {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
        return updated;
      });
      setStreaming(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', animation: 'fadeUp 0.3s ease' }}>

      {/* SOP context banner */}
      {sop && (
        <div style={{
          background: 'rgba(0,196,255,0.06)', border: '1px solid rgba(0,196,255,0.15)',
          borderRadius: 'var(--radius)', padding: '8px 14px', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>
            Context loaded: <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{sop.task_name}</span>
            {' '}— {sop.step_count} steps · {sop.compliance_standards?.join(', ')}
          </span>
        </div>
      )}

      {/* Quick prompts */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
        {QUICK_PROMPTS.map((q) => (
          <button key={q.label} onClick={() => send(q.text)} disabled={streaming} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '5px 12px', fontSize: 11,
            color: 'var(--text2)', fontFamily: 'DM Mono',
            transition: 'all 0.12s', cursor: streaming ? 'not-allowed' : 'pointer',
          }}
            onMouseEnter={(e) => { if (!streaming) { e.target.style.borderColor = 'var(--accent2)'; e.target.style.color = 'var(--accent)'; } }}
            onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)'; }}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
        padding: '1rem', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', marginBottom: '1rem',
      }}>
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '8px 8px 8px 14px',
        alignItems: 'flex-end',
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about your SOP, safety requirements, compliance, training..."
          rows={2}
          disabled={streaming}
          style={{
            flex: 1, resize: 'none', background: 'transparent', border: 'none',
            color: 'var(--text)', fontSize: 13, lineHeight: 1.5, outline: 'none',
            fontFamily: 'DM Sans',
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || streaming}
          className="btn btn-primary"
          style={{ padding: '8px 16px', flexShrink: 0 }}
        >
          {streaming ? <StreamingDots /> : 'Send'}
        </button>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 6, fontFamily: 'DM Mono' }}>
        SHIFT+ENTER for newline · powered by Claude claude-sonnet-4-20250514
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      animation: 'fadeUp 0.2s ease',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono', marginBottom: 4 }}>
        {isUser ? 'YOU' : 'GHOST SOP AI'}
      </div>
      <div style={{
        maxWidth: '85%', padding: '10px 14px',
        borderRadius: isUser ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
        background: isUser ? 'var(--accent2)' : 'var(--bg3)',
        border: isUser ? 'none' : '1px solid var(--border)',
        color: isUser ? '#fff' : message.error ? 'var(--red)' : 'var(--text)',
        fontSize: 13, lineHeight: 1.65,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {message.content}
        {message.streaming && <BlinkCursor />}
      </div>
    </div>
  );
}

function BlinkCursor() {
  return (
    <span style={{
      display: 'inline-block', width: 2, height: 14, background: 'var(--accent)',
      marginLeft: 3, verticalAlign: 'middle', animation: 'pulse 1s infinite',
    }} />
  );
}

function StreamingDots() {
  return (
    <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: '50%', background: '#000',
          animation: `pulse 1.2s ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  );
}
