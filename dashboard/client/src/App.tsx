import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Search,
  ExternalLink,
  Bot
} from 'lucide-react';

interface TestRun {
  id: number;
  app_name: string;
  test_name: string;
  status: 'pass' | 'fail';
  duration_ms?: number;
  error_message?: string | null;
  screenshot_path?: string | null;
  video_path?: string | null;
  run_timestamp?: string;
  ai_summary?: string | null;
  healing_suggestion?: string | null;
}

export function App() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [triaging, setTriaging] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/runs');
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (err) {
      console.error('Error fetching test runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const triggerTriage = async () => {
    try {
      setTriaging(true);
      const res = await fetch('/api/triage', { method: 'POST' });
      if (res.ok) {
        await fetchRuns();
      }
    } catch (err) {
      console.error('Error running triage:', err);
    } finally {
      setTriaging(false);
    }
  };

  // Metrics
  const totalRuns = runs.length;
  const passedRuns = runs.filter((r) => r.status === 'pass').length;
  const failedRuns = runs.filter((r) => r.status === 'fail').length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;
  const triagedRuns = runs.filter((r) => r.ai_summary).length;

  const appNames = Array.from(new Set(runs.map((r) => r.app_name)));

  // Filtered runs
  const filteredRuns = runs.filter((run) => {
    const matchesApp = selectedApp === 'all' || run.app_name === selectedApp;
    const matchesSearch =
      run.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (run.error_message && run.error_message.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (run.ai_summary && run.ai_summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesApp && matchesSearch;
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Bot size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Mediant Labs
              </h1>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                AI Test Platform • Week 2
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>
              Intelligent Test Orchestration, Automated Triage & Selector Healing
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            id="refresh-runs-btn"
            onClick={fetchRuns}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14,
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            id="run-triage-btn"
            onClick={triggerTriage}
            disabled={triaging}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: triaging ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={16} />
            {triaging ? 'Triaging with Claude...' : 'Run AI Triage'}
          </button>
        </div>
      </header>

      {/* KPI Metric Cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              TOTAL RUNS
            </span>
            <Layers size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{totalRuns}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
            Recorded in results.db
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              PASS RATE
            </span>
            <CheckCircle2 size={18} color="var(--status-pass)" />
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              marginTop: 8,
              color: passRate >= 80 ? 'var(--status-pass)' : passRate >= 50 ? '#fbbf24' : 'var(--status-fail)',
            }}
          >
            {passRate}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
            {passedRuns} passed / {failedRuns} failed
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              FAILURES
            </span>
            <XCircle size={18} color="var(--status-fail)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: failedRuns > 0 ? 'var(--status-fail)' : 'var(--text-main)' }}>
            {failedRuns}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
            Targeted for AI triage
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              AI TRIAGED
            </span>
            <Sparkles size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: 'var(--accent-purple)' }}>
            {triagedRuns}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
            Classified via Claude API
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            id="filter-app-all"
            onClick={() => setSelectedApp('all')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedApp === 'all' ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
              background: selectedApp === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: selectedApp === 'all' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            }}
          >
            All Applications ({runs.length})
          </button>
          {appNames.map((app) => {
            const appRuns = runs.filter((r) => r.app_name === app);
            const appFails = appRuns.filter((r) => r.status === 'fail').length;
            return (
              <button
                key={app}
                id={`filter-app-${app}`}
                onClick={() => setSelectedApp(app)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedApp === app ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                  background: selectedApp === app ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedApp === app ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{app}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: appFails > 0 ? 'var(--status-fail-bg)' : 'rgba(255, 255, 255, 0.1)',
                    color: appFails > 0 ? 'var(--status-fail)' : 'var(--text-dim)',
                  }}
                >
                  {appRuns.length}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <Search
            size={16}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: 12, top: 12 }}
          />
          <input
            id="search-input"
            type="text"
            placeholder="Search runs, errors, triage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Main Runs Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', width: 40 }}></th>
              <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>STATUS</th>
              <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>APP</th>
              <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>TEST NAME</th>
              <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>DURATION</th>
              <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>AI TRIAGE</th>
              <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>TIMESTAMP</th>
            </tr>
          </thead>
          <tbody>
            {filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No test runs found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredRuns.map((run) => {
                const isExpanded = expandedRow === run.id;
                const isRealBug = run.ai_summary && /REAL BUG/i.test(run.ai_summary);
                const isTestProblem = run.ai_summary && /TEST PROBLEM/i.test(run.ai_summary);

                return (
                  <React.Fragment key={run.id}>
                    <tr
                      id={`run-row-${run.id}`}
                      onClick={() => setExpandedRow(isExpanded ? null : run.id)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '16px 20px', color: 'var(--text-dim)' }}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            background: run.status === 'pass' ? 'var(--status-pass-bg)' : 'var(--status-fail-bg)',
                            color: run.status === 'pass' ? 'var(--status-pass)' : 'var(--status-fail)',
                            border: `1px solid ${run.status === 'pass' ? 'var(--status-pass-border)' : 'var(--status-fail-border)'}`,
                          }}
                        >
                          {run.status === 'pass' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {run.status === 'pass' ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: 'JetBrains Mono',
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--accent-cyan)',
                          }}
                        >
                          {run.app_name}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {run.test_name}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} color="var(--text-dim)" />
                          {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(2)}s` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {run.ai_summary ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isRealBug
                                ? 'rgba(239, 68, 68, 0.15)'
                                : isTestProblem
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(99, 102, 241, 0.15)',
                              color: isRealBug ? '#f87171' : isTestProblem ? '#fbbf24' : 'var(--accent-cyan)',
                              border: `1px solid ${
                                isRealBug
                                  ? 'rgba(239, 68, 68, 0.3)'
                                  : isTestProblem
                                  ? 'rgba(245, 158, 11, 0.3)'
                                  : 'rgba(99, 102, 241, 0.3)'
                              }`,
                            }}
                          >
                            <Sparkles size={12} />
                            {isRealBug ? 'REAL BUG' : isTestProblem ? 'TEST PROBLEM' : 'TRIAGED'}
                          </span>
                        ) : run.status === 'fail' ? (
                          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Pending Triage</span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-dim)', fontSize: 12 }}>
                        {run.run_timestamp || '—'}
                      </td>
                    </tr>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            padding: '20px 24px',
                            background: 'rgba(0, 0, 0, 0.35)',
                            borderBottom: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Failure Details */}
                            {run.error_message && (
                              <div
                                style={{
                                  background: 'rgba(244, 63, 94, 0.05)',
                                  border: '1px solid rgba(244, 63, 94, 0.2)',
                                  borderRadius: 8,
                                  padding: 16,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    color: 'var(--status-fail)',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    marginBottom: 8,
                                  }}
                                >
                                  <AlertTriangle size={16} />
                                  <span>Failure Stack / Error Message:</span>
                                </div>
                                <pre
                                  style={{
                                    fontSize: 12,
                                    color: '#fca5a5',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                    maxHeight: 180,
                                    overflowY: 'auto',
                                  }}
                                >
                                  {run.error_message}
                                </pre>
                              </div>
                            )}

                            {/* AI Triage & Selector Healing Analysis */}
                            {run.ai_summary && (
                              <div
                                style={{
                                  background: 'rgba(99, 102, 241, 0.08)',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  borderRadius: 8,
                                  padding: 18,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 10,
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Sparkles size={16} color="var(--accent-cyan)" />
                                    <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 14 }}>
                                      Claude AI Failure Triage
                                    </span>
                                  </div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.6 }}>
                                  {run.ai_summary}
                                </p>

                                {/* Selector Healing Suggestion with Governance Disclaimer */}
                                {run.healing_suggestion && (
                                  <div
                                    style={{
                                      marginTop: 14,
                                      padding: 14,
                                      borderRadius: 8,
                                      background: 'rgba(245, 158, 11, 0.08)',
                                      border: '1px solid rgba(245, 158, 11, 0.3)',
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: 12,
                                        fontWeight: 800,
                                        color: '#fbbf24',
                                        marginBottom: 6,
                                      }}
                                    >
                                      <ShieldAlert size={15} />
                                      <span>SELECTOR HEALING (HUMAN APPROVAL REQUIRED):</span>
                                    </div>
                                    <div
                                      style={{
                                        fontFamily: 'JetBrains Mono',
                                        fontSize: 12,
                                        color: '#fef3c7',
                                        background: 'rgba(0, 0, 0, 0.4)',
                                        padding: '8px 12px',
                                        borderRadius: 6,
                                      }}
                                    >
                                      {run.healing_suggestion}
                                    </div>
                                    <p
                                      style={{
                                        fontSize: 11,
                                        color: 'var(--text-dim)',
                                        marginTop: 6,
                                        fontStyle: 'italic',
                                      }}
                                    >
                                      * Governance Note: Self-healing suggestions must be reviewed and committed manually. The test platform strictly prohibits auto-committing fixes to codebase.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Attachments */}
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-dim)' }}>
                              {run.screenshot_path && (
                                <span>
                                  📸 Screenshot:{' '}
                                  <code style={{ color: 'var(--accent-cyan)' }}>{run.screenshot_path}</code>
                                </span>
                              )}
                              {run.video_path && (
                                <span>
                                  🎥 Video:{' '}
                                  <code style={{ color: 'var(--accent-cyan)' }}>{run.video_path}</code>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default App;
