import React, { useState, useEffect } from 'react';
import { listSOPs, deleteSOP } from '../lib/api.js';

export default function SOPLibraryPage({ setPage, setActiveSOP }) {
  const [sops, setSops]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [deleting, setDeleting] = useState(null);
  const [error, setError]       = useState('');

  useEffect(() => {
    fetchSOPs();
  }, []);

  const fetchSOPs = async () => {
    setLoading(true);
    try {
      const data = await listSOPs();
      setSops(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this SOP? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteSOP(id);
      setSops((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleOpen = (sop) => {
    setActiveSOP(sop);
    setPage('detail');
  };

  const filtered = sops.filter((s) =>
    !search ||
    s.task_name.toLowerCase().includes(search.toLowerCase()) ||
    s.domain.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--text2)' }}>
        <div style={{ width: 20, height: 20, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading SOP library...
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by task name or domain..."
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={() => setPage('capture')}>
          + New SOP
        </button>
        <button className="btn btn-ghost" onClick={fetchSOPs}>Refresh</button>
      </div>

      {error && (
        <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--red)' }}>{error}</div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          color: 'var(--text3)', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.25 }}>◻</div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            {search ? 'No SOPs match your search.' : 'No SOPs generated yet.'}
          </div>
          <button className="btn btn-primary" onClick={() => setPage('capture')}>
            Generate your first SOP
          </button>
        </div>
      )}

      {/* Stats row */}
      {sops.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
          <StatCard val={sops.length}            label="Total SOPs" />
          <StatCard val={[...new Set(sops.map((s) => s.domain))].length} label="Domains covered" />
          <StatCard val={sops.reduce((a, s) => a + (s.step_count || 0), 0)} label="Steps documented" />
        </div>
      )}

      {/* SOP grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {filtered.map((sop, i) => (
          <SOPCard
            key={sop.id}
            sop={sop}
            index={i}
            onOpen={() => handleOpen(sop)}
            onDelete={(e) => handleDelete(sop.id, e)}
            isDeleting={deleting === sop.id}
          />
        ))}
      </div>
    </div>
  );
}

function SOPCard({ sop, index, onOpen, onDelete, isDeleting }) {
  const date = new Date(sop.generated_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div
      onClick={onOpen}
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
        cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
        animation: `fadeUp 0.25s ${index * 0.04}s ease both`,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border2)';
        e.currentTarget.style.background  = 'var(--bg3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background  = 'var(--bg2)';
      }}
    >
      {/* Domain badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span className="badge badge-blue" style={{ fontSize: 9 }}>{sop.domain?.toUpperCase()}</span>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          style={{
            background: 'transparent', border: 'none', color: 'var(--text3)',
            fontSize: 12, padding: '2px 6px', borderRadius: 4,
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => { e.target.style.color = 'var(--red)'; }}
          onMouseLeave={(e) => { e.target.style.color = 'var(--text3)'; }}
        >
          {isDeleting ? '...' : '✕'}
        </button>
      </div>

      {/* Title */}
      <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 14, marginBottom: 6, lineHeight: 1.3 }}>
        {sop.task_name}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono', marginBottom: 10 }}>
        <span>{sop.step_count} steps</span>
        <span>{date}</span>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'DM Mono' }}>
          ID: {sop.id.slice(0, 8)}…
        </span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>Open →</span>
      </div>
    </div>
  );
}

function StatCard({ val, label }) {
  return (
    <div style={{
      flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '10px 14px',
    }}>
      <div style={{ fontSize: 22, fontFamily: 'Syne', fontWeight: 700, color: 'var(--text)' }}>{val}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono', marginTop: 2 }}>{label}</div>
    </div>
  );
}
