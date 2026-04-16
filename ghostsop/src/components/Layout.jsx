import React from 'react';

const NAV = [
  { id: 'capture', label: 'Capture Task',      icon: <CamIcon /> },
  { id: 'library', label: 'SOP Library',       icon: <LibIcon /> },
  { id: 'detail',  label: 'SOP Viewer',         icon: <DocIcon /> },
  { id: 'deviate', label: 'Deviation Alerts',   icon: <AlertIcon /> },
  { id: 'chat',    label: 'AI Assistant',        icon: <ChatIcon /> },
];

export default function Layout({ children, page, setPage, stats, activeSOP }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar page={page} setPage={setPage} stats={stats} activeSOP={activeSOP} />
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Topbar page={page} activeSOP={activeSOP} />
        <div style={{ flex: 1, padding: '1.5rem 2rem', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

function Sidebar({ page, setPage, stats, activeSOP }) {
  return (
    <aside style={{
      width: 240, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="#000" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="#000"/>
              <path d="M8 2.5V1M8 15v-1.5M2.5 8H1M15 8h-1.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Ghost SOP
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono' }}>AI AGENT v1.0</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0.5rem 0', flex: 1 }}>
        {NAV.map((item) => (
          <NavItem key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
        ))}
      </nav>

      {/* Stats */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono', letterSpacing: '0.08em', marginBottom: 10 }}>
          SESSION STATS
        </div>
        {[
          { label: 'SOPs generated', val: stats.sops },
          { label: 'Steps captured', val: stats.steps },
          { label: 'Deviations flagged', val: stats.deviations },
        ].map((s) => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
            <span style={{ color: 'var(--text3)' }}>{s.label}</span>
            <span style={{ fontFamily: 'DM Mono', color: s.val > 0 ? 'var(--accent)' : 'var(--text2)' }}>{s.val}</span>
          </div>
        ))}
        {activeSOP && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono', marginBottom: 3 }}>ACTIVE SOP</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>{activeSOP.task_name}</div>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({ item, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 1.25rem', background: active ? 'rgba(0,196,255,0.07)' : 'transparent',
      borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
      color: active ? 'var(--text)' : 'var(--text3)',
      fontWeight: active ? 500 : 400, fontSize: 13,
      transition: 'all 0.12s', textAlign: 'left',
    }}>
      <span style={{ opacity: active ? 1 : 0.5, color: active ? 'var(--accent)' : 'inherit' }}>{item.icon}</span>
      {item.label}
    </button>
  );
}

function Topbar({ page, activeSOP }) {
  const titles = {
    capture: 'Capture Task',
    library: 'SOP Library',
    detail:  activeSOP ? activeSOP.task_name : 'SOP Viewer',
    deviate: 'Deviation Detection',
    chat:    'AI Assistant',
  };
  return (
    <header style={{
      height: 52, borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 15 }}>{titles[page]}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono' }}>AGENT ONLINE</span>
      </div>
    </header>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
function CamIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none"/><circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M5.5 4V3h5v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg>;
}
function LibIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/><rect x="9" y="2" width="5" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/><rect x="9" y="11" width="5" height="3" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>;
}
function DocIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}
function AlertIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1l7 13H1L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/><path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function ChatIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M4 12l2 3 2-3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/><path d="M4 6h8M4 9h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}