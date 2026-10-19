import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, ExternalLink, Code } from 'lucide-react';

export const OpenApiViewer: React.FC = () => {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'docs' | 'raw'>('docs');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const res = await fetch('/api/docs/openapi.json');
        if (res.ok) {
          const data = await res.json();
          setSpec(data);
        }
      } catch (err) {
        console.error('Failed to load OpenAPI spec:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpec();
  }, []);

  const handleCopySpec = () => {
    if (spec) {
      navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDownloadSpec = () => {
    if (!spec) return;
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'openapi.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getMethodBadge = (m: string) => {
    const method = m.toUpperCase();
    switch (method) {
      case 'GET':
        return 'text-cyan-400 bg-cyan-950/70 border-cyan-800';
      case 'POST':
        return 'text-emerald-400 bg-emerald-950/70 border-emerald-800';
      case 'PUT':
        return 'text-amber-400 bg-amber-950/70 border-amber-800';
      case 'PATCH':
        return 'text-indigo-400 bg-indigo-950/70 border-indigo-800';
      case 'DELETE':
        return 'text-rose-400 bg-rose-950/70 border-rose-800';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">OpenAPI 3.0.3 Contract</h2>
          <p className="text-sm text-slate-400 mt-1">
            Machine-readable microservice contract ready for Swagger UI, Redoc, or Postman collections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md border border-slate-800">
            <button
              onClick={() => setViewMode('docs')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'docs' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive View
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'raw' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw JSON
            </button>
          </div>

          <button
            onClick={handleCopySpec}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Spec'}</span>
          </button>

          <button
            onClick={handleDownloadSpec}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs font-mono">
          Loading OpenAPI specification...
        </div>
      ) : viewMode === 'raw' ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
          <pre className="bg-slate-950 border border-slate-800/80 rounded-md p-4 text-xs font-mono text-cyan-300 overflow-x-auto max-h-[600px] leading-relaxed scrollbar-thin">
            {JSON.stringify(spec, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-6">
          {spec?.paths &&
            Object.entries(spec.paths).map(([endpointPath, pathItem]: [string, any]) => (
              <div
                key={endpointPath}
                className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden"
              >
                <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-200">{endpointPath}</span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {Object.entries(pathItem).map(([method, op]: [string, any]) => (
                    <div key={method} className="p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${getMethodBadge(
                              method
                            )}`}
                          >
                            {method.toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold text-slate-200">{op.summary}</span>
                        </div>
                        {op.tags && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Tag: {op.tags.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Parameters Table */}
                      {op.parameters && op.parameters.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Parameters
                          </div>
                          <div className="border border-slate-800 rounded-md overflow-hidden bg-slate-950">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px]">
                                <tr>
                                  <th className="px-3 py-2">Name</th>
                                  <th className="px-3 py-2">In</th>
                                  <th className="px-3 py-2">Type</th>
                                  <th className="px-3 py-2">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {op.parameters.map((p: any) => (
                                  <tr key={p.name} className="hover:bg-slate-900/40">
                                    <td className="px-3 py-2 text-cyan-300 font-semibold">{p.name}</td>
                                    <td className="px-3 py-2 text-slate-400">{p.in}</td>
                                    <td className="px-3 py-2 text-slate-400">{p.schema?.type || 'string'}</td>
                                    <td className="px-3 py-2 text-slate-300 font-sans">{p.description || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Expected Responses */}
                      {op.responses && (
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Responses
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {Object.entries(op.responses).map(([code, resp]: [string, any]) => (
                              <div
                                key={code}
                                className="flex items-center gap-2 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs"
                              >
                                <span
                                  className={`font-mono font-bold ${
                                    code.startsWith('2')
                                      ? 'text-emerald-400'
                                      : code.startsWith('4')
                                      ? 'text-amber-400'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {code}
                                </span>
                                <span className="text-slate-400 text-[11px]">{resp.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
