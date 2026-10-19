import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Terminal, Layers, Shield, Cpu, RefreshCw } from 'lucide-react';

export const DockerStudio: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'dockerfile' | 'compose' | 'dockerignore'>('dockerfile');
  const [fileContents, setFileContents] = useState<{
    dockerfile: string;
    dockerCompose: string;
    dockerignore: string;
  }>({
    dockerfile: '',
    dockerCompose: '',
    dockerignore: '',
  });
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  // Command Builder State
  const [customPort, setCustomPort] = useState('3000');
  const [containerName, setContainerName] = useState('notes-api');
  const [mountVolume, setMountVolume] = useState(true);
  const [enableMemLimit, setEnableMemLimit] = useState(true);

  // Fetch docker files from server
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoadingFiles(true);
        const res = await fetch('/api/docker/files');
        if (res.ok) {
          const data = await res.json();
          setFileContents({
            dockerfile: data.dockerfile || '',
            dockerCompose: data.dockerCompose || '',
            dockerignore: data.dockerignore || '',
          });
        }
      } catch (err) {
        console.error('Failed to load docker files:', err);
      } finally {
        setLoadingFiles(false);
      }
    };
    loadFiles();
  }, []);

  const getCurrentContent = () => {
    switch (activeFile) {
      case 'dockerfile':
        return fileContents.dockerfile;
      case 'compose':
        return fileContents.dockerCompose;
      case 'dockerignore':
        return fileContents.dockerignore;
    }
  };

  const handleCopyFile = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadFile = () => {
    const filename =
      activeFile === 'dockerfile'
        ? 'Dockerfile'
        : activeFile === 'compose'
        ? 'docker-compose.yml'
        : '.dockerignore';
    const blob = new Blob([getCurrentContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate Docker CLI string
  const generateDockerRunCmd = () => {
    let cmd = `docker run -d \\\n  --name ${containerName || 'notes-api'} \\\n  -p ${customPort || '3000'}:3000`;
    if (mountVolume) {
      cmd += ` \\\n  -v notes_data:/data`;
    }
    if (enableMemLimit) {
      cmd += ` \\\n  --memory="256m" \\\n  --cpus="0.75"`;
    }
    cmd += ` \\\n  --restart unless-stopped \\\n  notes-api:latest`;
    return cmd;
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(generateDockerRunCmd());
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 1500);
  };

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Docker & Alpine Container Studio</h2>
          <p className="text-sm text-slate-400 mt-1">
            Examine multi-stage Docker build files, Alpine Linux image size optimizations, and security parameters.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Base: node:20-alpine</span>
          <span aria-hidden="true">·</span>
          <span>Footprint: ~130 MB</span>
          <span aria-hidden="true">·</span>
          <span>Non-root: UID 1000</span>
        </div>
      </div>

      {/* Benchmark Size Comparison Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Image Size Benchmark</h3>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold tabular-nums">
            88% Storage Reduction
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {/* Debian Full */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Standard Node.js Debian Image (`node:20`)</span>
              <span className="font-mono text-slate-400 tabular-nums">1,120 MB</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-slate-600 rounded-full w-full" />
            </div>
          </div>

          {/* Debian Slim */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Debian Slim Image (`node:20-slim`)</span>
              <span className="font-mono text-slate-400 tabular-nums">380 MB</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-slate-500 rounded-full w-[34%]" />
            </div>
          </div>

          {/* Alpine Linux */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-cyan-300 font-medium">This Alpine Multi-Stage Container (`node:20-alpine`)</span>
              <span className="font-mono text-cyan-400 font-bold tabular-nums">132 MB</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full w-[12%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Layers className="w-4 h-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Multi-Stage Caching
            </h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Separates production dependencies from build tooling. Layer caching ensures rebuilds take seconds instead of minutes.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Shield className="w-4 h-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Non-Root Security
            </h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Executes under the unprivileged <code className="text-slate-300 font-mono">USER node</code> (UID 1000) preventing privilege escalation into the host kernel.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <Cpu className="w-4 h-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Tini Signal Forwarding
            </h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Integrates <code className="text-slate-300 font-mono">tini</code> as PID 1 to properly reap zombie processes and instantly forward SIGINT and SIGTERM signals.
          </p>
        </div>
      </div>

      {/* Docker Command Builder */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">CLI Command Generator</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Host Port</label>
            <input
              type="text"
              value={customPort}
              onChange={(e) => setCustomPort(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              placeholder="3000"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Container Name</label>
            <input
              type="text"
              value={containerName}
              onChange={(e) => setContainerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              placeholder="notes-api"
            />
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="volumeMount"
              checked={mountVolume}
              onChange={(e) => setMountVolume(e.target.checked)}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0"
            />
            <label htmlFor="volumeMount" className="text-xs text-slate-300 select-none cursor-pointer">
              Mount Data Volume (/data)
            </label>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="memLimit"
              checked={enableMemLimit}
              onChange={(e) => setEnableMemLimit(e.target.checked)}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0"
            />
            <label htmlFor="memLimit" className="text-xs text-slate-300 select-none cursor-pointer">
              Enforce 256MB Limit
            </label>
          </div>
        </div>

        {/* Generated Command Box */}
        <div className="relative">
          <pre className="bg-slate-950 border border-slate-800 rounded-md p-3.5 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
            {generateDockerRunCmd()}
          </pre>
          <button
            onClick={handleCopyCli}
            className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded transition-colors border border-slate-700 cursor-pointer"
          >
            {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCli ? 'Copied' : 'Copy Command'}</span>
          </button>
        </div>
      </div>

      {/* File Inspector Tabs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          {/* Segmented controls for files */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
            <button
              onClick={() => setActiveFile('dockerfile')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                activeFile === 'dockerfile'
                  ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dockerfile
            </button>
            <button
              onClick={() => setActiveFile('compose')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                activeFile === 'compose'
                  ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              docker-compose.yml
            </button>
            <button
              onClick={() => setActiveFile('dockerignore')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                activeFile === 'dockerignore'
                  ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              .dockerignore
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyFile}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-950 bg-cyan-400 hover:bg-cyan-300 font-semibold rounded-md transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* File Content Preview */}
        {loadingFiles ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs font-mono">
            Loading container configuration...
          </div>
        ) : (
          <pre className="bg-slate-950 border border-slate-800/80 rounded-md p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed scrollbar-thin">
            {getCurrentContent()}
          </pre>
        )}
      </div>
    </div>
  );
};
