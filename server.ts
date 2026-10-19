import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Enable JSON body parsing with reasonable limit
app.use(express.json({ limit: '1mb' }));

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Telemetry & metrics collector
const startTime = Date.now();
const telemetry = {
  totalRequests: 0,
  requestsByMethod: {
    GET: 0,
    POST: 0,
    PUT: 0,
    PATCH: 0,
    DELETE: 0,
  } as Record<string, number>,
  responseTimes: [] as number[],
};

// Response timing middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqStart = Date.now();
  telemetry.totalRequests++;
  telemetry.requestsByMethod[req.method] = (telemetry.requestsByMethod[req.method] || 0) + 1;

  res.on('finish', () => {
    const duration = Date.now() - reqStart;
    telemetry.responseTimes.push(duration);
    if (telemetry.responseTimes.length > 500) {
      telemetry.responseTimes.shift();
    }
  });
  next();
});

// Note data model
export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  pinned: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

const defaultNotes: Note[] = [
  {
    id: 'note_alp_01',
    title: 'Alpine Linux Multi-Stage Optimization',
    content: 'Standard Node.js Debian images weigh ~1.1GB. Using node:20-alpine slims runtime footprint to ~130MB while removing unnecessary compilers, build utilities, and attack surface. Multi-stage separation ensures devDependencies never pollute production images.',
    category: 'Docker',
    tags: ['alpine', 'optimization', 'multi-stage', 'security'],
    pinned: true,
    color: 'emerald',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'note_alp_02',
    title: 'Container Signal Handling & Tini Init',
    content: 'In Docker containers, processes run as PID 1 by default. Standard Node.js does not harvest zombie processes or forward SIGINT/SIGTERM properly. Integrating /sbin/tini ensures prompt container shutdowns and clean signal lifecycle without orphaned child processes.',
    category: 'Architecture',
    tags: ['docker', 'tini', 'signals', 'pid1'],
    pinned: true,
    color: 'cyan',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'note_alp_03',
    title: 'Microservice Healthcheck Specifications',
    content: 'Implementing GET /api/health with memory RSS metrics and uptime allows Docker HEALTHCHECK, Kubernetes liveness probes, and load balancers to accurately diagnose service availability and trigger automatic container self-healing if memory limits approach thresholds.',
    category: 'DevOps',
    tags: ['healthcheck', 'k8s', 'monitoring', 'express'],
    pinned: false,
    color: 'amber',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'note_alp_04',
    title: 'Non-Root Security Hardening in Dockerfile',
    content: 'Running microservices as root exposes the host kernel to potential breakout exploits. The Dockerfile specifies "USER node" (UID 1000) and grants explicit ownership of /data and /app to unprivileged users, adhering to CIS benchmark container standards.',
    category: 'Security',
    tags: ['cis-benchmarks', 'non-root', 'linux', 'least-privilege'],
    pinned: false,
    color: 'indigo',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

let notes: Note[] = [...defaultNotes];

// Helper to calculate memory
const getMemoryStats = () => {
  const mem = process.memoryUsage();
  return {
    rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
    heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
    heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
    externalMb: Math.round((mem.external / 1024 / 1024) * 10) / 10,
  };
};

/* ========================================================================== */
/* REST API ROUTES                                                            */
/* ========================================================================== */

// 1. Healthcheck endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.round((Date.now() - startTime) / 1000 * 10) / 10;
  res.json({
    status: 'healthy',
    service: 'dockerized-notes-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    environment: process.env.NODE_ENV || 'development',
    container: {
      platform: 'linux/alpine',
      nodeVersion: process.version,
      pid: process.pid,
      memoryUsage: getMemoryStats(),
    },
  });
});

// 2. Metrics endpoint
app.get('/api/metrics', (_req: Request, res: Response) => {
  const avgResponse = telemetry.responseTimes.length > 0
    ? Math.round(telemetry.responseTimes.reduce((a, b) => a + b, 0) / telemetry.responseTimes.length * 10) / 10
    : 0;

  const categoriesCount: Record<string, number> = {};
  const tagsCount: Record<string, number> = {};
  let pinnedCount = 0;

  for (const n of notes) {
    if (n.pinned) pinnedCount++;
    categoriesCount[n.category] = (categoriesCount[n.category] || 0) + 1;
    for (const t of n.tags) {
      tagsCount[t] = (tagsCount[t] || 0) + 1;
    }
  }

  res.json({
    service: 'dockerized-notes-api',
    uptimeSeconds: Math.round((Date.now() - startTime) / 1000),
    totalRequests: telemetry.totalRequests,
    requestsByMethod: telemetry.requestsByMethod,
    averageResponseTimeMs: avgResponse,
    notesStats: {
      total: notes.length,
      pinned: pinnedCount,
      categoriesCount,
      tagsCount,
    },
  });
});

// 3. List notes (with search, category, tag, pinned, and sorting)
app.get('/api/notes', (req: Request, res: Response) => {
  const { search, category, tag, pinned, sort = 'updatedAt', order = 'desc' } = req.query;

  let filtered = [...notes];

  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (typeof category === 'string' && category.trim()) {
    filtered = filtered.filter(n => n.category.toLowerCase() === category.toLowerCase().trim());
  }

  if (typeof tag === 'string' && tag.trim()) {
    filtered = filtered.filter(n => n.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase().trim()));
  }

  if (typeof pinned === 'string') {
    const isPinned = pinned === 'true';
    filtered = filtered.filter(n => n.pinned === isPinned);
  }

  // Sort
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sort === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else if (sort === 'createdAt') {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      // default: updatedAt
      cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return order === 'asc' ? cmp : -cmp;
  });

  res.json({
    total: filtered.length,
    notes: filtered,
  });
});

// 4. Get single note by ID
app.get('/api/notes/:id', (req: Request, res: Response) => {
  const note = notes.find(n => n.id === req.params.id);
  if (!note) {
    res.status(404).json({ error: 'Note not found', id: req.params.id });
    return;
  }
  res.json(note);
});

// 5. Create note
app.post('/api/notes', (req: Request, res: Response) => {
  const { title, content, category, tags, pinned, color } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Validation failed: "title" is required and cannot be empty.' });
    return;
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: 'Validation failed: "content" is required and cannot be empty.' });
    return;
  }

  const cleanTags = Array.isArray(tags)
    ? tags.map(t => String(t).trim().toLowerCase()).filter(Boolean)
    : [];

  const newNote: Note = {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    content: content.trim(),
    category: (category && typeof category === 'string' && category.trim()) ? category.trim() : 'General',
    tags: cleanTags,
    pinned: Boolean(pinned),
    color: color && typeof color === 'string' ? color : 'cyan',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  notes.unshift(newNote);
  res.status(201).json(newNote);
});

// 6. Update note
app.put('/api/notes/:id', (req: Request, res: Response) => {
  const idx = notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Note not found', id: req.params.id });
    return;
  }

  const { title, content, category, tags, pinned, color } = req.body;

  if (title !== undefined && (!title || typeof title !== 'string' || !title.trim())) {
    res.status(400).json({ error: 'Validation failed: "title" must be a non-empty string.' });
    return;
  }

  if (content !== undefined && (!content || typeof content !== 'string' || !content.trim())) {
    res.status(400).json({ error: 'Validation failed: "content" must be a non-empty string.' });
    return;
  }

  const existing = notes[idx];
  const updated: Note = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    content: content !== undefined ? content.trim() : existing.content,
    category: category !== undefined ? category.trim() : existing.category,
    tags: Array.isArray(tags) ? tags.map(t => String(t).trim().toLowerCase()).filter(Boolean) : existing.tags,
    pinned: pinned !== undefined ? Boolean(pinned) : existing.pinned,
    color: color !== undefined ? color : existing.color,
    updatedAt: new Date().toISOString(),
  };

  notes[idx] = updated;
  res.json(updated);
});

// 7. Toggle pinned status
app.patch('/api/notes/:id/pin', (req: Request, res: Response) => {
  const idx = notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Note not found', id: req.params.id });
    return;
  }

  notes[idx].pinned = !notes[idx].pinned;
  notes[idx].updatedAt = new Date().toISOString();
  res.json(notes[idx]);
});

// 8. Delete note
app.delete('/api/notes/:id', (req: Request, res: Response) => {
  const idx = notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Note not found', id: req.params.id });
    return;
  }

  const deleted = notes.splice(idx, 1)[0];
  res.json({
    success: true,
    message: 'Note permanently removed',
    deletedNote: deleted,
  });
});

// 9. Reset notes to default
app.post('/api/notes/reset', (_req: Request, res: Response) => {
  notes = [...defaultNotes];
  res.json({
    success: true,
    message: 'Notes database reset to default demo items',
    count: notes.length,
  });
});

// 10. OpenAPI 3.0 Specification endpoint
app.get('/api/docs/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'Dockerized Notes API',
      description: 'Lightweight Node.js Express REST microservice packaged in an Alpine Linux Docker container for rapid deployment.',
      version: '1.0.0',
      contact: {
        name: 'DevOps & Microservice Engineering',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current microservice host',
      },
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Container health and runtime diagnostics',
          tags: ['System'],
          responses: {
            '200': { description: 'Microservice is healthy' },
          },
        },
      },
      '/api/metrics': {
        get: {
          summary: 'Observability & throughput metrics',
          tags: ['System'],
          responses: {
            '200': { description: 'Telemetry data returned' },
          },
        },
      },
      '/api/notes': {
        get: {
          summary: 'List notes with optional search, category, tag, and sort',
          tags: ['Notes'],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Query text in title or content' },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'tag', in: 'query', schema: { type: 'string' } },
            { name: 'pinned', in: 'query', schema: { type: 'boolean' } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['updatedAt', 'createdAt', 'title'] } },
            { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          ],
          responses: {
            '200': { description: 'Array of notes returned' },
          },
        },
        post: {
          summary: 'Create a new note',
          tags: ['Notes'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string', example: 'Review Alpine Dockerfile' },
                    content: { type: 'string', example: 'Verify multi-stage caching and non-root UID 1000.' },
                    category: { type: 'string', example: 'DevOps' },
                    tags: { type: 'array', items: { type: 'string' }, example: ['docker', 'security'] },
                    pinned: { type: 'boolean', example: true },
                    color: { type: 'string', example: 'cyan' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Note created successfully' },
            '400': { description: 'Validation error' },
          },
        },
      },
      '/api/notes/{id}': {
        get: {
          summary: 'Retrieve single note by ID',
          tags: ['Notes'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Note found' },
            '404': { description: 'Note not found' },
          },
        },
        put: {
          summary: 'Update note by ID',
          tags: ['Notes'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    category: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    pinned: { type: 'boolean' },
                    color: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Note updated' },
            '404': { description: 'Note not found' },
          },
        },
        delete: {
          summary: 'Delete note by ID',
          tags: ['Notes'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Note removed' },
            '404': { description: 'Note not found' },
          },
        },
      },
    },
  });
});

// 11. Read Docker and repo files for the interactive viewer
app.get('/api/docker/files', (_req: Request, res: Response) => {
  try {
    const dockerfile = fs.readFileSync(path.join(__dirname, 'Dockerfile'), 'utf-8');
    const dockerCompose = fs.readFileSync(path.join(__dirname, 'docker-compose.yml'), 'utf-8');
    const dockerignore = fs.readFileSync(path.join(__dirname, '.dockerignore'), 'utf-8');
    const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf-8');

    res.json({
      dockerfile,
      dockerCompose,
      dockerignore,
      readme,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read container files', details: String(err) });
  }
});

/* ========================================================================== */
/* VITE DEV SERVER OR PRODUCTION STATIC SERVING                               */
/* ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Dockerized Notes API] Running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Dockerized Notes API] Failed to start server:', err);
  process.exit(1);
});
