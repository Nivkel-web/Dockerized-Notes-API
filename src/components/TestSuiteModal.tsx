import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, AlertCircle, RotateCcw, Clock } from 'lucide-react';
import { ApiTestResult } from '../types/notes';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ isOpen, onClose }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [totalTimeMs, setTotalTimeMs] = useState(0);

  const runAllTests = async () => {
    setRunning(true);
    setResults([]);
    const testRuns: ApiTestResult[] = [];
    const suiteStart = performance.now();

    try {
      // Test 1: Healthcheck
      const t1Start = performance.now();
      try {
        const res1 = await fetch('/api/health');
        const lat1 = Math.round(performance.now() - t1Start);
        const data1 = await res1.json();
        const passed1 = res1.status === 200 && data1.status === 'healthy';
        testRuns.push({
          endpoint: '/api/health',
          method: 'GET',
          status: res1.status,
          expectedStatus: 200,
          latencyMs: lat1,
          passed: passed1,
          details: `Status "${data1.status}", platform: "${data1.container?.platform}"`,
        });
      } catch (err: any) {
        testRuns.push({
          endpoint: '/api/health',
          method: 'GET',
          status: 0,
          expectedStatus: 200,
          latencyMs: 0,
          passed: false,
          details: err.message,
        });
      }
      setResults([...testRuns]);

      // Test 2: Metrics
      const t2Start = performance.now();
      try {
        const res2 = await fetch('/api/metrics');
        const lat2 = Math.round(performance.now() - t2Start);
        const data2 = await res2.json();
        const passed2 = res2.status === 200 && typeof data2.totalRequests === 'number';
        testRuns.push({
          endpoint: '/api/metrics',
          method: 'GET',
          status: res2.status,
          expectedStatus: 200,
          latencyMs: lat2,
          passed: passed2,
          details: `Recorded ${data2.totalRequests} requests, ${data2.notesStats?.total} notes`,
        });
      } catch (err: any) {
        testRuns.push({
          endpoint: '/api/metrics',
          method: 'GET',
          status: 0,
          expectedStatus: 200,
          latencyMs: 0,
          passed: false,
          details: err.message,
        });
      }
      setResults([...testRuns]);

      // Test 3: Create Note
      let createdNoteId = '';
      const t3Start = performance.now();
      try {
        const res3 = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Automated CI/CD Validation Note',
            content: 'Created during container automated test suite execution.',
            category: 'DevOps',
            tags: ['automated', 'test', 'ci'],
            pinned: false,
          }),
        });
        const lat3 = Math.round(performance.now() - t3Start);
        const data3 = await res3.json();
        createdNoteId = data3.id;
        const passed3 = res3.status === 201 && Boolean(createdNoteId);
        testRuns.push({
          endpoint: '/api/notes',
          method: 'POST',
          status: res3.status,
          expectedStatus: 201,
          latencyMs: lat3,
          passed: passed3,
          details: `Created note document id: ${createdNoteId}`,
        });
      } catch (err: any) {
        testRuns.push({
          endpoint: '/api/notes',
          method: 'POST',
          status: 0,
          expectedStatus: 201,
          latencyMs: 0,
          passed: false,
          details: err.message,
        });
      }
      setResults([...testRuns]);

      // Test 4: Get Note by ID
      if (createdNoteId) {
        const t4Start = performance.now();
        try {
          const res4 = await fetch(`/api/notes/${createdNoteId}`);
          const lat4 = Math.round(performance.now() - t4Start);
          const data4 = await res4.json();
          const passed4 = res4.status === 200 && data4.id === createdNoteId;
          testRuns.push({
            endpoint: `/api/notes/${createdNoteId}`,
            method: 'GET',
            status: res4.status,
            expectedStatus: 200,
            latencyMs: lat4,
            passed: passed4,
            details: `Successfully retrieved note with title: "${data4.title}"`,
          });
        } catch (err: any) {
          testRuns.push({
            endpoint: `/api/notes/${createdNoteId}`,
            method: 'GET',
            status: 0,
            expectedStatus: 200,
            latencyMs: 0,
            passed: false,
            details: err.message,
          });
        }
        setResults([...testRuns]);

        // Test 5: Patch Pin status
        const t5Start = performance.now();
        try {
          const res5 = await fetch(`/api/notes/${createdNoteId}/pin`, { method: 'PATCH' });
          const lat5 = Math.round(performance.now() - t5Start);
          const data5 = await res5.json();
          const passed5 = res5.status === 200 && data5.pinned === true;
          testRuns.push({
            endpoint: `/api/notes/${createdNoteId}/pin`,
            method: 'PATCH',
            status: res5.status,
            expectedStatus: 200,
            latencyMs: lat5,
            passed: passed5,
            details: `Pin state successfully flipped to: ${data5.pinned}`,
          });
        } catch (err: any) {
          testRuns.push({
            endpoint: `/api/notes/${createdNoteId}/pin`,
            method: 'PATCH',
            status: 0,
            expectedStatus: 200,
            latencyMs: 0,
            passed: false,
            details: err.message,
          });
        }
        setResults([...testRuns]);

        // Test 6: Delete created note
        const t6Start = performance.now();
        try {
          const res6 = await fetch(`/api/notes/${createdNoteId}`, { method: 'DELETE' });
          const lat6 = Math.round(performance.now() - t6Start);
          const data6 = await res6.json();
          const passed6 = res6.status === 200 && data6.success === true;
          testRuns.push({
            endpoint: `/api/notes/${createdNoteId}`,
            method: 'DELETE',
            status: res6.status,
            expectedStatus: 200,
            latencyMs: lat6,
            passed: passed6,
            details: `Cleaned up test note: ${data6.message}`,
          });
        } catch (err: any) {
          testRuns.push({
            endpoint: `/api/notes/${createdNoteId}`,
            method: 'DELETE',
            status: 0,
            expectedStatus: 200,
            latencyMs: 0,
            passed: false,
            details: err.message,
          });
        }
        setResults([...testRuns]);
      }

      // Test 7: 404 Error handling
      const t7Start = performance.now();
      try {
        const res7 = await fetch('/api/notes/non_existent_note_9999');
        const lat7 = Math.round(performance.now() - t7Start);
        const passed7 = res7.status === 404;
        testRuns.push({
          endpoint: '/api/notes/non_existent_note_9999',
          method: 'GET',
          status: res7.status,
          expectedStatus: 404,
          latencyMs: lat7,
          passed: passed7,
          details: 'Handled missing entity correctly with 404 status code',
        });
      } catch (err: any) {
        testRuns.push({
          endpoint: '/api/notes/non_existent_note_9999',
          method: 'GET',
          status: 0,
          expectedStatus: 404,
          latencyMs: 0,
          passed: false,
          details: err.message,
        });
      }
      setResults([...testRuns]);
    } finally {
      setTotalTimeMs(Math.round(performance.now() - suiteStart));
      setRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAllTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-white">Live Microservice Test Suite</h3>
            {results.length > 0 && !running && (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {passedCount} / {results.length} PASSED
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status banner */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-3 py-2 bg-slate-950 rounded border border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <span>Target: Express REST Engine</span>
            <span aria-hidden="true">·</span>
            <span>Platform: Alpine Linux container</span>
          </div>
          {totalTimeMs > 0 && (
            <div className="flex items-center gap-1 font-mono tabular-nums text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{totalTimeMs} ms</span>
            </div>
          )}
        </div>

        {/* Results list */}
        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
          {results.map((res, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border text-xs font-mono transition-all ${
                res.passed
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-rose-950/20 border-rose-900 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 truncate">
                  {res.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-bold text-cyan-400 shrink-0">{res.method}</span>
                  <span className="truncate text-slate-300 font-semibold">{res.endpoint}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="tabular-nums text-slate-400">{res.latencyMs} ms</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                      res.status === res.expectedStatus
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    HTTP {res.status}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 text-[11px] font-sans text-slate-400 pl-6">
                {res.details}
              </div>
            </div>
          ))}

          {running && (
            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Executing test assertions against Express container API...</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={runAllTests}
            disabled={running}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-md transition-colors border border-slate-700"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            <span>Rerun Suite</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
