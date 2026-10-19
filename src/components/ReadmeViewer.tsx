import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, FileText, ExternalLink } from 'lucide-react';

export const ReadmeViewer: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReadme = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/docker/files');
        if (res.ok) {
          const data = await res.json();
          setContent(data.readme || '');
        }
      } catch (err) {
        console.error('Failed to load README.md:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReadme();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'README.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">GitHub README.md</h2>
          <p className="text-sm text-slate-400 mt-1">
            Complete production-ready documentation formatted for GitHub with badges, architecture, and Docker commands.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download README.md</span>
          </button>
        </div>
      </div>

      {/* Code / Markdown View */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-semibold text-slate-200">README.md</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Markdown (CommonMark)</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs font-mono">
            Loading repository README...
          </div>
        ) : (
          <pre className="bg-slate-950 border border-slate-800/80 rounded-md p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[650px] leading-relaxed scrollbar-thin whitespace-pre-wrap">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
};
