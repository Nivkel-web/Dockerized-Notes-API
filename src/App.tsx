import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ApiPlayground } from './components/ApiPlayground';
import { NotesManager } from './components/NotesManager';
import { DockerStudio } from './components/DockerStudio';
import { OpenApiViewer } from './components/OpenApiViewer';
import { ReadmeViewer } from './components/ReadmeViewer';
import { TestSuiteModal } from './components/TestSuiteModal';
import { HealthResponse } from './types/notes';
import { Play, Terminal, Layers, FileText, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'playground' | 'notes' | 'docker' | 'openapi' | 'readme'>('playground');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  // Poll health data once at startup
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data: HealthResponse = await res.json();
          setHealthData(data);
        }
      } catch (err) {
        console.error('Failed to poll health:', err);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* 3-Zone Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunTests={() => setIsTestModalOpen(true)}
        serverHealthy={healthData?.status === 'healthy'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white" style={{ textWrap: 'balance' }}>
              Dockerized Notes API
            </h1>
            <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
              Lightweight Node.js Express REST microservice packaged in an Alpine Linux Docker container for rapid deployment.
            </p>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Base Container
              </span>
              <div className="font-mono text-sm font-bold text-slate-100 flex items-center gap-1.5 truncate">
                <span>node:20-alpine</span>
              </div>
              <span className="text-[11px] text-slate-500 block truncate">musl libc · minimal image</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Compressed Footprint
              </span>
              <div className="font-mono text-sm font-bold text-cyan-400 tabular-nums">
                ~130 MB
              </div>
              <span className="text-[11px] text-slate-500 block">88% smaller than Debian</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Process Security
              </span>
              <div className="font-mono text-sm font-bold text-slate-100">
                USER node
              </div>
              <span className="text-[11px] text-slate-500 block">UID 1000 · Least privilege</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Microservice Health
              </span>
              <div className="font-mono text-sm font-bold text-emerald-400 tabular-nums flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>{healthData ? '200 OK (Healthy)' : 'Online'}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
                {healthData ? `uptime ${healthData.uptimeSeconds}s · rss ${healthData.container.memoryUsage.rssMb}MB` : 'Express engine active'}
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Views */}
        <div className="pt-2">
          {activeTab === 'playground' && <ApiPlayground />}
          {activeTab === 'notes' && <NotesManager />}
          {activeTab === 'docker' && <DockerStudio />}
          {activeTab === 'openapi' && <OpenApiViewer />}
          {activeTab === 'readme' && <ReadmeViewer />}
        </div>
      </main>

      {/* Clean Footer adhering to design guidelines */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-400">Dockerized Notes API</span>
            <span aria-hidden="true">·</span>
            <span>Node.js 20 LTS</span>
            <span aria-hidden="true">·</span>
            <span>Express 4.21</span>
            <span aria-hidden="true">·</span>
            <span>Alpine Linux</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('readme')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              GitHub Documentation
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('docker')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Container Architecture
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Run Test Assertions
            </button>
          </div>
        </div>
      </footer>

      {/* Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
}
