import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, Code, RotateCcw, ArrowRight } from 'lucide-react';

interface EndpointConfig {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  defaultParams?: Record<string, string>;
  defaultBody?: string;
  defaultPathParams?: Record<string, string>;
}

const AVAILABLE_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'health',
    name: 'Container Healthcheck',
    method: 'GET',
    path: '/api/health',
    description: 'Diagnoses runtime container status, Alpine platform, PID, uptime, and RSS/heap memory allocation.',
  },
  {
    id: 'metrics',
    name: 'Telemetry Metrics',
    method: 'GET',
    path: '/api/metrics',
    description: 'Returns total request throughput, method distribution, average latency, and category counts.',
  },
  {
    id: 'list_notes',
    name: 'List Notes',
    method: 'GET',
    path: '/api/notes',
    description: 'Query all notes with optional parameters for search keywords, category filtering, and sorting.',
    defaultParams: {
      search: '',
      category: '',
      tag: '',
      pinned: '',
      sort: 'updatedAt',
      order: 'desc',
    },
  },
  {
    id: 'get_note',
    name: 'Get Note by ID',
    method: 'GET',
    path: '/api/notes/:id',
    description: 'Retrieve full details of a specific note using its identifier.',
    defaultPathParams: {
      id: 'note_alp_01',
    },
  },
  {
    id: 'create_note',
    name: 'Create Note',
    method: 'POST',
    path: '/api/notes',
    description: 'Creates a new persistent note document with title, content, tags, and category.',
    defaultBody: JSON.stringify(
      {
        title: 'Kubernetes Ingress & TLS Termination',
        content: 'Configured automated cert-manager with Let\'s Encrypt for the Alpine microservice ingress router.',
        category: 'DevOps',
        tags: ['k8s', 'ingress', 'tls'],
        pinned: true,
      },
      null,
      2
    ),
  },
  {
    id: 'update_note',
    name: 'Update Note',
    method: 'PUT',
    path: '/api/notes/:id',
    description: 'Updates properties on an existing note document.',
    defaultPathParams: {
      id: 'note_alp_01',
    },
    defaultBody: JSON.stringify(
      {
        title: 'Alpine Linux Multi-Stage Optimization (Audited)',
        content: 'Verified multi-stage Docker build yields a compressed 130MB container image adhering to unprivileged UID 1000 standards.',
        tags: ['alpine', 'docker', 'audited'],
      },
      null,
      2
    ),
  },
  {
    id: 'toggle_pin',
    name: 'Toggle Pin Status',
    method: 'PATCH',
    path: '/api/notes/:id/pin',
    description: 'Inverts the boolean pinned status of a target note.',
    defaultPathParams: {
      id: 'note_alp_02',
    },
  },
  {
    id: 'delete_note',
    name: 'Delete Note',
    method: 'DELETE',
    path: '/api/notes/:id',
    description: 'Permanently deletes a note document by ID.',
    defaultPathParams: {
      id: 'note_alp_04',
    },
  },
  {
    id: 'reset_notes',
    name: 'Reset Sample Notes',
    method: 'POST',
    path: '/api/notes/reset',
    description: 'Restores the original Alpine Linux architecture notes dataset.',
  },
];

export const ApiPlayground: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(AVAILABLE_ENDPOINTS[0]);
  const [pathParams, setPathParams] = useState<Record<string, string>>(
    AVAILABLE_ENDPOINTS[0].defaultPathParams || {}
  );
  const [queryParams, setQueryParams] = useState<Record<string, string>>(
    AVAILABLE_ENDPOINTS[0].defaultParams || {}
  );
  const [requestBody, setRequestBody] = useState<string>(
    AVAILABLE_ENDPOINTS[0].defaultBody || ''
  );

  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseStatusText, setResponseStatusText] = useState<string>('');
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [activeCodeLang, setActiveCodeLang] = useState<'curl' | 'js' | 'python' | 'httpie'>('curl');

  // Switch endpoint helper
  const handleSelectEndpoint = (ep: EndpointConfig) => {
    setSelectedEndpoint(ep);
    setPathParams(ep.defaultPathParams || {});
    setQueryParams(ep.defaultParams || {});
    setRequestBody(ep.defaultBody || '');
    setResponseBody(null);
    setResponseStatus(null);
  };

  // Build resolved path
  const buildResolvedUrl = () => {
    let resolved = selectedEndpoint.path;
    if (pathParams) {
      Object.entries(pathParams).forEach(([k, v]) => {
        resolved = resolved.replace(`:${k}`, encodeURIComponent(v || ''));
      });
    }

    if (queryParams) {
      const activeQuery = Object.entries(queryParams)
        .filter(([_, v]) => v && v.trim() !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      if (activeQuery) {
        resolved += `?${activeQuery}`;
      }
    }
    return resolved;
  };

  const resolvedUrl = buildResolvedUrl();

  // Execute Request
  const handleExecute = async () => {
    setIsLoading(true);
    const start = performance.now();

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(resolvedUrl, options);
      const latency = Math.round(performance.now() - start);

      setResponseStatus(res.status);
      setResponseStatusText(res.statusText || (res.status === 200 ? 'OK' : res.status === 201 ? 'Created' : ''));
      setResponseLatency(latency);

      // Collect headers
      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      setResponseHeaders(headersObj);

      const data = await res.json().catch(() => ({}));
      setResponseBody(JSON.stringify(data, null, 2));
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      setResponseStatus(500);
      setResponseStatusText('Network Error');
      setResponseLatency(latency);
      setResponseBody(JSON.stringify({ error: err.message || 'Connection failed' }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate code snippets
  const generateSnippet = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const fullUrl = `${origin}${resolvedUrl}`;

    switch (activeCodeLang) {
      case 'curl': {
        if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
          const escaped = requestBody.replace(/'/g, `'\\''`);
          return `curl -X ${selectedEndpoint.method} "${fullUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '${escaped}'`;
        }
        return `curl -X ${selectedEndpoint.method} "${fullUrl}"`;
      }
      case 'js': {
        if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
          return `const response = await fetch("${fullUrl}", {\n  method: "${selectedEndpoint.method}",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(${requestBody.trim()})\n});\nconst data = await response.json();\nconsole.log(data);`;
        }
        return `const response = await fetch("${fullUrl}");\nconst data = await response.json();\nconsole.log(data);`;
      }
      case 'python': {
        if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
          return `import requests\n\npayload = ${requestBody.trim()}\nresponse = requests.${selectedEndpoint.method.toLowerCase()}("${fullUrl}", json=payload)\nprint(response.json())`;
        }
        return `import requests\n\nresponse = requests.${selectedEndpoint.method.toLowerCase()}("${fullUrl}")\nprint(response.json())`;
      }
      case 'httpie': {
        if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
          return `http ${selectedEndpoint.method} "${fullUrl}" <<< '${requestBody.replace(/\n/g, '')}'`;
        }
        return `http ${selectedEndpoint.method} "${fullUrl}"`;
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleCopyResponse = () => {
    if (responseBody) {
      navigator.clipboard.writeText(responseBody);
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 1500);
    }
  };

  // Method color helper
  const getMethodColor = (m: string) => {
    switch (m) {
      case 'GET':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
      case 'POST':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      case 'PUT':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'PATCH':
        return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60';
      case 'DELETE':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Interactive REST Playground</h2>
          <p className="text-sm text-slate-400 mt-1">
            Dispatch live requests against the containerized Express REST endpoints with real latency measurements.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Engine: Express 4.21</span>
          <span aria-hidden="true">·</span>
          <span>Runtime: Node 20 Alpine</span>
          <span aria-hidden="true">·</span>
          <span>Protocol: HTTP/1.1</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Endpoints Directory */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Endpoints
          </div>
          <div className="space-y-1 mt-1">
            {AVAILABLE_ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-center justify-between gap-2 text-xs font-medium ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border ${getMethodColor(
                        ep.method
                      )}`}
                    >
                      {ep.method}
                    </span>
                    <span className="truncate">{ep.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0">
                    {ep.path.split('/')[2]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Request Composer & Live Response Viewer */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Request Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-xs font-bold px-2 py-1 rounded border ${getMethodColor(
                    selectedEndpoint.method
                  )}`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm font-semibold text-slate-200">
                  {resolvedUrl}
                </span>
              </div>
              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 rounded-md transition-colors whitespace-nowrap shadow-sm active:scale-95 cursor-pointer"
              >
                {isLoading ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isLoading ? 'Executing...' : 'Send Request'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">{selectedEndpoint.description}</p>

            {/* Path Parameters Editor if applicable */}
            {selectedEndpoint.defaultPathParams && (
              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">Path Parameters</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys(selectedEndpoint.defaultPathParams).map((paramKey) => (
                    <div key={paramKey}>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        :{paramKey}
                      </label>
                      <input
                        type="text"
                        value={pathParams[paramKey] || ''}
                        onChange={(e) =>
                          setPathParams({ ...pathParams, [paramKey]: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. note_alp_01"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query Parameters Editor if applicable */}
            {selectedEndpoint.defaultParams && (
              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">Query Parameters</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.keys(selectedEndpoint.defaultParams).map((qKey) => (
                    <div key={qKey}>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        {qKey}
                      </label>
                      <input
                        type="text"
                        value={queryParams[qKey] || ''}
                        onChange={(e) =>
                          setQueryParams({ ...queryParams, [qKey]: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                        placeholder={
                          qKey === 'search'
                            ? 'keyword...'
                            : qKey === 'category'
                            ? 'Docker, DevOps...'
                            : qKey === 'pinned'
                            ? 'true / false'
                            : qKey
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body Editor for POST/PUT */}
            {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">
                    JSON Request Payload
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    application/json
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
                  placeholder="Enter JSON payload"
                />
              </div>
            )}
          </div>

          {/* Response Console */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-200">Server Response</span>
                {responseStatus !== null && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {responseStatus} {responseStatusText}
                    </span>
                    {responseLatency !== null && (
                      <span className="text-xs font-mono tabular-nums text-slate-400">
                        {responseLatency} ms
                      </span>
                    )}
                  </div>
                )}
              </div>

              {responseBody && (
                <button
                  onClick={handleCopyResponse}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedResponse ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedResponse ? 'Copied' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            {responseBody ? (
              <pre className="bg-slate-950 border border-slate-800/80 rounded-md p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto max-h-96 leading-relaxed scrollbar-thin">
                {responseBody}
              </pre>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                Click "Send Request" above to execute this endpoint on the Express server.
              </div>
            )}
          </div>

          {/* Code Snippet Generator */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200">Copy Client Command</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                {(['curl', 'js', 'python', 'httpie'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveCodeLang(lang)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                      activeCodeLang === lang
                        ? 'bg-slate-800 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'js' ? 'Fetch (JS)' : lang === 'python' ? 'Python' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {generateSnippet()}
              </pre>
              <button
                onClick={handleCopyCode}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono rounded transition-colors border border-slate-700 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
