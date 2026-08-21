import React, { useState } from 'react';

const SAFETY_RATING_STYLE = {
  low:      { color: 'var(--green)', badge: 'badge-green' },
  medium:   { color: 'var(--amber)', badge: 'badge-amber' },
  high:     { color: 'var(--red)',   badge: 'badge-red'   },
  critical: { color: 'var(--red)',   badge: 'badge-red'   },
};

export default function SOPDetailPage({ sop, setPage }) {
  const [expandedStep, setExpandedStep] = useState(null);
  const [filter, setFilter]             = useState('all');

  if (!sop) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text3)' }}>
        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>◻</div>
        <div style={{ marginBottom: 16 }}>No SOP loaded yet.</div>
        <button className="btn btn-primary" onClick={() => setPage('capture')}>
          → Capture a Task
        </button>
      </div>
    );
  }

  const safetyStyle = SAFETY_RATING_STYLE[sop.overall_safety_rating] || SAFETY_RATING_STYLE.medium;
  const cycleTime   = formatTime(sop.total_cycle_time_seconds);

  const filteredSteps = sop.steps.filter((s) => {
    if (filter === 'critical') return s.is_critical_step;
    if (filter === 'quality')  return !!s.quality_checkpoint;
    if (filter === 'safety')   return s.safety_flags?.length > 0;
    return true;
  });

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>

      {/* Header card */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono', marginBottom: 4 }}>
              {sop.domain?.toUpperCase()} · {sop.revision} · {new Date(sop.generated_at).toLocaleDateString('en-IN')}
            </div>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>{sop.task_name}</h2>
            {sop.worker_name && (
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Operator: {sop.worker_name}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => window.print()}>Export PDF</button>
            <button className="btn btn-ghost" onClick={() => setPage('deviate')}>→ Detect Deviations</button>
            <button className="btn btn-ghost" onClick={() => setPage('chat')}>→ AI Assistant</button>
          </div>
        </div>

        {/* Metrics row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: '1.25rem' }}>
          {[
            { val: sop.step_count,                    label: 'Total steps'        },
            { val: sop.quality_checkpoint_count,      label: 'Quality gates'      },
            { val: cycleTime,                         label: 'Cycle time'         },
            { val: sop.skill_level_required,          label: 'Skill level'        },
            { val: sop.overall_safety_rating,         label: 'Safety rating', color: safetyStyle.color },
          ].map((m) => (
            <div key={m.label} style={{
              background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '10px 12px',
            }}>
              <div style={{ fontSize: 16, fontFamily: 'Syne', fontWeight: 700, color: m.color || 'var(--text)', textTransform: 'capitalize' }}>
                {m.val}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono', marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Compliance standards */}
        {sop.compliance_standards?.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {sop.compliance_standards.map((s) => (
              <span key={s} className="tag tag-reg">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all',      label: `All steps (${sop.step_count})` },
          { id: 'critical', label: `Critical (${sop.steps.filter((s) => s.is_critical_step).length})` },
          { id: 'quality',  label: `Quality gates (${sop.quality_checkpoint_count})` },
          { id: 'safety',   label: `Safety flags (${sop.steps.filter((s) => s.safety_flags?.length).length})` },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontFamily: 'DM Mono',
            background: filter === f.id ? 'var(--accent)' : 'var(--bg2)',
            color: filter === f.id ? '#000' : 'var(--text2)',
            border: `1px solid ${filter === f.id ? 'var(--accent)' : 'var(--border)'}`,
            transition: 'all 0.12s',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredSteps.map((step, i) => (
          <StepCard
            key={step.step_number}
            step={step}
            index={i}
            expanded={expandedStep === step.step_number}
            onToggle={() => setExpandedStep(expandedStep === step.step_number ? null : step.step_number)}
          />
        ))}
      </div>
    </div>
  );
}

function StepCard({ step, index, expanded, onToggle }) {
  const isCritical = step.is_critical_step;
  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${isCritical ? 'rgba(255,82,82,0.25)' : 'var(--border)'}`,
      borderLeft: `3px solid ${isCritical ? 'var(--red)' : 'var(--accent2)'}`,
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      animation: `fadeUp 0.2s ${index * 0.03}s ease both`,
      transition: 'border-color 0.15s',
    }}>

      {/* Step header — always visible */}
      <button onClick={onToggle} style={{
        width: '100%', background: 'transparent', display: 'flex',
        alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer',
        textAlign: 'left',
      }}>
        {/* Step number */}
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: isCritical ? 'var(--red-dim)' : 'rgba(0,196,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'DM Mono', fontSize: 12, fontWeight: 500,
          color: isCritical ? 'var(--red)' : 'var(--accent)',
        }}>
          {String(step.step_number).padStart(2, '0')}
        </div>

        {/* Action + tags row */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{step.action}</span>
            {isCritical && <span className="badge badge-red" style={{ fontSize: 9 }}>CRITICAL</span>}
            {step.quality_checkpoint && <span className="badge badge-green" style={{ fontSize: 9 }}>QC GATE</span>}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {step.tools_required?.slice(0, 3).map((t) => (
              <span key={t} className="tag tag-tool" style={{ fontSize: 10 }}>{t}</span>
            ))}
            {step.duration_seconds > 0 && (
              <span className="tag tag-time" style={{ fontSize: 10 }}>{formatTime(step.duration_seconds)}</span>
            )}
            {step.safety_flags?.slice(0, 2).map((f) => (
              <span key={f} className="tag tag-safe" style={{ fontSize: 10 }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Chevron */}
        <div style={{
          color: 'var(--text3)', fontSize: 12, transition: 'transform 0.2s',
          transform: expanded ? 'rotate(90deg)' : 'none', flexShrink: 0,
        }}>›</div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '0 14px 14px 58px',
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
          animation: 'fadeUp 0.2s ease',
        }}>
          {/* Full instruction */}
          <div style={{
            fontSize: 13, color: 'var(--text2)', lineHeight: 1.7,
            marginBottom: step.quality_checkpoint ? 12 : 0,
          }}>
            {step.instruction}
          </div>

          {/* Quality checkpoint */}
          {step.quality_checkpoint && (
            <div style={{
              background: 'var(--green-dim)', border: '1px solid rgba(0,230,118,0.2)',
              borderRadius: 6, padding: '8px 12px', marginBottom: 10,
            }}>
              <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'DM Mono', marginBottom: 3 }}>QUALITY CHECKPOINT</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>{step.quality_checkpoint}</div>
            </div>
          )}

          {/* Safety flags */}
          {step.safety_flags?.length > 0 && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid rgba(255,82,82,0.2)',
              borderRadius: 6, padding: '8px 12px', marginBottom: 10,
            }}>
              <div style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'DM Mono', marginBottom: 3 }}>SAFETY REQUIREMENTS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {step.safety_flags.map((f) => (
                  <span key={f} className="tag tag-safe" style={{ fontSize: 11 }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Regulatory tags */}
          {step.regulatory_tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {step.regulatory_tags.map((r) => (
                <span key={r} className="tag tag-reg">{r}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s > 0 ? s + 's' : ''}`.trim() : `${s}s`;
}
