import React from 'react';
import { Activity, Play } from 'lucide-react';

interface HeaderProps {
  activeTab: 'playground' | 'notes' | 'docker' | 'openapi' | 'readme';
  setActiveTab: (tab: 'playground' | 'notes' | 'docker' | 'openapi' | 'readme') => void;
  onRunTests: () => void;
  serverHealthy: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRunTests,
  serverHealthy,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('playground');
            }}
            className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <span className="font-mono text-sm font-black">N</span>
            </div>
            <span>Dockerized Notes API</span>
          </a>

          {/* Zone 2: 4-5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <button
              onClick={() => setActiveTab('playground')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'playground' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
              }`}
            >
              API Playground
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'notes' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
              }`}
            >
              Live Notes
            </button>
            <button
              onClick={() => setActiveTab('docker')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'docker' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
              }`}
            >
              Docker & Container
            </button>
            <button
              onClick={() => setActiveTab('openapi')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'openapi' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
              }`}
            >
              OpenAPI Spec
            </button>
            <button
              onClick={() => setActiveTab('readme')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'readme' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
              }`}
            >
              GitHub README
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onRunTests}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-cyan-500/20 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run API Tests</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Scrollbar */}
        <div className="md:hidden flex items-center gap-4 overflow-x-auto py-2 border-t border-slate-800/60 text-xs font-medium text-slate-400 scrollbar-none">
          <button
            onClick={() => setActiveTab('playground')}
            className={`whitespace-nowrap px-2 py-1 rounded ${activeTab === 'playground' ? 'text-cyan-400 bg-slate-900 font-semibold' : ''}`}
          >
            Playground
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`whitespace-nowrap px-2 py-1 rounded ${activeTab === 'notes' ? 'text-cyan-400 bg-slate-900 font-semibold' : ''}`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`whitespace-nowrap px-2 py-1 rounded ${activeTab === 'docker' ? 'text-cyan-400 bg-slate-900 font-semibold' : ''}`}
          >
            Docker
          </button>
          <button
            onClick={() => setActiveTab('openapi')}
            className={`whitespace-nowrap px-2 py-1 rounded ${activeTab === 'openapi' ? 'text-cyan-400 bg-slate-900 font-semibold' : ''}`}
          >
            OpenAPI
          </button>
          <button
            onClick={() => setActiveTab('readme')}
            className={`whitespace-nowrap px-2 py-1 rounded ${activeTab === 'readme' ? 'text-cyan-400 bg-slate-900 font-semibold' : ''}`}
          >
            README.md
          </button>
        </div>
      </div>
    </header>
  );
};
