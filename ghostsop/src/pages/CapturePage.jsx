import React, { useState, useRef } from 'react';
import { generateSOP, analyzeTask } from '../services/api.js';

const PRESET_TASKS = [
  { name: 'PCB Assembly',        domain: 'Electronics Manufacturing',   icon: '⬡' },
  { name: 'Valve Torque Check',  domain: 'Automotive',                  icon: '◎' },
  { name: 'Blister Packing',     domain: 'Pharmaceutical GMP',          icon: '▦' },
  { name: 'Weld Bead Inspection',domain: 'Heavy Industry',              icon: '∿' },
  { name: 'Hydraulic Hose Fit',  domain: 'Aerospace MRO',               icon: '⊕' },
  { name: 'Tablet Coating QC',   domain: 'Pharmaceutical GMP',          icon: '◉' },
];

export default function CapturePage({ onSOPGenerated }) {
  const [taskName, setTaskName] = useState('');
  const [domain, setDomain]     = useState('');
  const [worker, setWorker]     = useState('');
  const [running, setRunning]   = useState(false);
  const [logs, setLogs]         = useState([]);
  const [pct, setPct]           = useState(0);
  const [progLabel, setProgLabel] = useState('');
  const [analysis, setAnalysis]   = useState(null);
  const logRef = useRef(null);

  const addLog = (msg, type = '') => {
    const time = new Date().toTimeString().slice(0, 8);
    setLogs((l) => [...l, { msg, type, time }]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 30);
  };

  const handleAnalyze = async (name) => {
    if (!name || name.length < 3) return;
    const result = await analyzeTask(name);
    if (result) {
      setAnalysis(result);
      if (!domain) setDomain(result.domain || '');
    }
  };

  const handlePreset = (p) => {
    setTaskName(p.name);
    setDomain(p.domain);
    setAnalysis(null);
    handleAnalyze(p.name);
  };

  const handleGenerate = async () => {
    if (!taskName || !domain) return;
    setRunning(true);
    setLogs([]);
    setPct(0);

    try {
      addLog('Initialising Ghost SOP agent...', 'info');
      const sop = await generateSOP(
        { task_name: taskName, domain, worker_name: worker },
        (progress) => {
          if (progress.pct !== undefined) setPct(progress.pct);
          if (progress.message) {
            setProgLabel(progress.message);
            addLog(progress.message, progress.stage === 'assemble' ? 'ok' : progress.stage === 'checkpoints' ? 'ok' : 'info');
          }
        }
      );
      addLog(`SOP generated: ${sop.step_count} steps · ${sop.quality_checkpoint_count} quality gates`, 'ok');
      setPct(100);
      setTimeout(() => onSOPGenerated(sop), 600);
    } catch (err) {
      addLog(`Error: ${err.message}`, 'err');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', animation: 'fadeUp 0.3s ease' }}>

      {/* Left — Input */}
      <div>
        <SectionLabel>Task Configuration</SectionLabel>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <Label>Task name</Label>
          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onBlur={(e) => handleAnalyze(e.target.value)}
            placeholder="e.g. PCB Assembly, Valve Torque Check..."
            style={{ width: '100%', marginBottom: 10 }}
          />

          <Label>Industry domain</Label>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. Automotive, Pharma, Electronics..."
            style={{ width: '100%', marginBottom: 10 }}
          />

          <Label>Operator name (optional)</Label>
          <input
            value={worker}
            onChange={(e) => setWorker(e.target.value)}
            placeholder="e.g. Ravi Kumar"
            style={{ width: '100%' }}
          />
        </div>

        {analysis && (
          <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(0,196,255,0.2)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono', marginBottom: 8 }}>QUICK ANALYSIS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="badge badge-blue">{analysis.domain}</span>
              <span className={`badge badge-${analysis.risk_level === 'critical' ? 'red' : analysis.risk_level === 'high' ? 'amber' : 'green'}`}>
                {analysis.risk_level?.toUpperCase()} RISK
              </span>
              <span className="badge badge-purple">~{analysis.suggested_steps} steps</span>
            </div>
            {analysis.key_standards?.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {analysis.key_standards.map((s) => <span key={s} className="tag tag-reg">{s}</span>)}
              </div>
            )}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px 0' }}
          disabled={!taskName || !domain || running}
          onClick={handleGenerate}
        >
          {running ? <><Spinner /> Generating SOP...</> : '→ Generate SOP with AI Agent'}
        </button>
      </div>

      {/* Right — Presets + Agent Log */}
      <div>
        <SectionLabel>Quick presets</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' }}>
          {PRESET_TASKS.map((p) => (
            <button key={p.name} onClick={() => handlePreset(p)} style={{
              background: taskName === p.name ? 'rgba(0,196,255,0.1)' : 'var(--bg2)',
              border: `1px solid ${taskName === p.name ? 'rgba(0,196,255,0.4)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: '10px 12px', textAlign: 'left',
              color: taskName === p.name ? 'var(--accent)' : 'var(--text2)',
              transition: 'all 0.12s',
            }}>
              <div style={{ fontSize: 16, marginBottom: 3 }}>{p.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'inherit' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{p.domain}</div>
            </button>
          ))}
        </div>

        {(logs.length > 0 || running) && (
          <>
            <SectionLabel>Agent log</SectionLabel>
            <div className="card" style={{ padding: '0.75rem 1rem' }}>
              {running && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>
                    <span className="mono">{progLabel}</span>
                    <span className="mono">{pct}%</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={logRef} style={{ maxHeight: 220, overflowY: 'auto' }}>
                {logs.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4, fontSize: 12 }}>
                    <span className="mono" style={{ color: 'var(--text3)', flexShrink: 0 }}>{l.time}</span>
                    <span className="mono" style={{ color: l.type === 'ok' ? 'var(--green)' : l.type === 'err' ? 'var(--red)' : l.type === 'info' ? 'var(--accent)' : 'var(--text2)' }}>
                      {l.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono', letterSpacing: '0.1em', marginBottom: 10 }}>{children}</div>;
}
function Label({ children }) {
  return <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>{children}</div>;
}
function Spinner() {
  return <div style={{ width: 12, height: 12, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;
}