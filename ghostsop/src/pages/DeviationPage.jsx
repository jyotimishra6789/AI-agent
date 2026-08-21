import React, { useState } from 'react';
import { detectDeviation } from '../lib/api.js';

const SEVERITY_STYLE = {
  critical: { badge: 'badge-red',   bar: 'var(--red)',   label: 'CRITICAL' },
  high:     { badge: 'badge-red',   bar: 'var(--red)',   label: 'HIGH'     },
  medium:   { badge: 'badge-amber', bar: 'var(--amber)', label: 'MEDIUM'   },
  low:      { badge: 'badge-green', bar: 'var(--green)', label: 'LOW'      },
};

const TYPE_LABEL = {
  missed_step:       'Missed Step',
  wrong_order:       'Wrong Order',
  timing_deviation:  'Timing Deviation',
  quality_failure:   'Quality Failure',
  safety_violation:  'Safety Violation',
};

export default function DeviationPage({ sop, onDeviation }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading]         = useState(false);
  const [deviations, setDeviations]   = useState(null);
  const [error, setError]             = useState('');

  const run = async () => {
    if (!sop)         return setError('Generate a SOP first on the Capture tab.');
    if (!description) return setError('Describe the re-run recording.');
    setError('');
    setLoading(true);
    setDeviations(null);
    try {
      const result = await detectDeviation(sop, description);
      setDeviations(result.deviations || []);
      if (result.deviations?.length > 0) onDeviation?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = deviations?.filter((d) => d.severity === 'critical' || d.severity === 'high').length ?? 0;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>

      {/* Active SOP banner */}
      {sop ? (
        <div style={{
          background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.18)',
          borderRadius: 'var(--radius)', padding: '8px 14px', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>
            Baseline SOP: <span style={{ color: 'var(--green)', fontWeight: 500 }}>{sop.task_name}</span>
            {' '}— {sop.step_count} steps loaded
          </span>
        </div>
      ) : (
        <div style={{
          background: 'var(--amber-dim)', border: '1px solid rgba(255,179,0,0.25)',
          borderRadius: 'var(--radius)', padding: '8px 14px', marginBottom: '1.25rem',
          fontSize: 12, color: 'var(--amber)',
        }}>
          No SOP loaded. Go to Capture Task and generate a SOP first.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Left — input */}
        <div>
          <Label>Describe the re-run recording</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Describe what the worker did in the re-run, e.g.:\n\n"Worker started at step 1 (ESD strap) then jumped directly to step 3, skipping part verification. Completed reflow oven step but did not scan tray barcode. AOI scan was done very quickly, under 10 seconds."`}
            rows={10}
            style={{ width: '100%', resize: 'vertical', lineHeight: 1.6 }}
          />
          {error && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red)' }}>{error}</div>
          )}
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px 0', marginTop: 10 }}
            onClick={run}
            disabled={loading || !sop}
          >
            {loading
              ? <><Spinner /> Analysing deviations...</>
              : '→ Run Deviation Detection'}
          </button>

          {/* Quick test scenarios */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono', marginBottom: 8 }}>QUICK TEST SCENARIOS</div>
            {SCENARIOS.map((s) => (
              <button key={s.label} onClick={() => setDescription(s.text)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '8px 12px', marginBottom: 6,
                color: 'var(--text2)', fontSize: 12, transition: 'border-color 0.12s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border2)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ color: 'var(--accent)', fontFamily: 'DM Mono', marginRight: 8 }}>›</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right — results */}
        <div>
          {deviations === null && !loading && (
            <div style={{
              height: '100%', minHeight: 200, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 8,
              color: 'var(--text3)', fontSize: 13,
            }}>
              <div style={{ fontSize: 28, opacity: 0.3 }}>◎</div>
              <div>Deviation analysis will appear here</div>
            </div>
          )}

          {loading && (
            <div style={{
              height: '100%', minHeight: 200, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text2)',
            }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 12, fontFamily: 'DM Mono' }}>AI analysing deviations...</div>
            </div>
          )}

          {deviations !== null && !loading && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              {/* Summary bar */}
              <div style={{
                display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap',
              }}>
                <StatPill val={deviations.length} label="Total deviations" color="var(--text)" />
                <StatPill val={criticalCount} label="Critical / High" color={criticalCount > 0 ? 'var(--red)' : 'var(--green)'} />
                <StatPill val={deviations.length === 0 ? '✓' : deviations.length} label={deviations.length === 0 ? 'All clear' : 'Action needed'} color={deviations.length === 0 ? 'var(--green)' : 'var(--amber)'} />
              </div>

              {deviations.length === 0 ? (
                <div style={{
                  padding: '1.5rem', textAlign: 'center', background: 'var(--green-dim)',
                  border: '1px solid rgba(0,230,118,0.2)', borderRadius: 'var(--radius-lg)',
                  color: 'var(--green)', fontSize: 13,
                }}>
                  No deviations detected. Re-run matches baseline SOP.
                </div>
              ) : (
                deviations.map((d, i) => <DeviationCard key={i} deviation={d} index={i} />)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeviationCard({ deviation, index }) {
  const s = SEVERITY_STYLE[deviation.severity] || SEVERITY_STYLE.low;
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderLeft: `3px solid ${s.bar}`,
      borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 10,
      animation: `fadeUp 0.25s ${index * 0.05}s ease both`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          {deviation.step_number && (
            <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text3)', marginRight: 8 }}>
              STEP {deviation.step_number}
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            {TYPE_LABEL[deviation.deviation_type] || deviation.deviation_type}
          </span>
        </div>
        <span className={`badge ${s.badge}`}>{s.label}</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.55 }}>
        {deviation.description}
      </p>
      <div style={{
        fontSize: 11, color: 'var(--accent)', background: 'rgba(0,196,255,0.06)',
        border: '1px solid rgba(0,196,255,0.15)', borderRadius: 6, padding: '6px 10px',
        lineHeight: 1.5, fontFamily: 'DM Mono',
      }}>
        ↳ {deviation.recommendation}
      </div>
    </div>
  );
}

function StatPill({ val, label, color }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '8px 14px', flex: 1, minWidth: 80,
    }}>
      <div style={{ fontSize: 20, fontFamily: 'Syne', fontWeight: 700, color }}>{val}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, fontFamily: 'DM Mono' }}>{children}</div>;
}

function Spinner() {
  return <div style={{ width: 12, height: 12, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;
}

const SCENARIOS = [
  {
    label: 'Worker skipped step 2 and rushed quality check',
    text: 'Worker put on ESD strap (step 1) then moved directly to applying solder paste, skipping the component tray verification entirely. The AOI scan was completed in under 8 seconds instead of the normal 30 seconds.',
  },
  {
    label: 'Steps performed out of order',
    text: 'Worker completed step 3 before step 2. The functional test (step 7) was done before the AOI scan (step 6). All other steps were completed correctly and in reasonable time.',
  },
  {
    label: 'Safety violation — no PPE',
    text: 'Worker did not connect the ESD wrist strap before handling components. Proceeded through all other steps in correct order but without grounding. No other issues observed.',
  },
];
