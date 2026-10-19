# Dockerized Notes API 📝 🐳

> Lightweight Node.js Express REST microservice packaged in an Alpine Linux Docker container for rapid deployment.

[![Node.js](https://img.shields.io/badge/Node.js-20.x_LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Alpine_Linux-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Image Size](https://img.shields.io/badge/Image_Size-~130_MB-brightgreen)](https://hub.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/REST_API-Active-success)](/)

A production-ready microservice built with **Express** and **Node.js**, containerized using a multi-stage **Alpine Linux Dockerfile** with non-root security enforcement, PID 1 signal management (`tini`), persistent volume capability, live metrics, and built-in interactive developer documentation.

---

## ✨ Highlights

- **⚡ Lightweight Footprint**: Packaged on `node:20-alpine` reducing container image size to ~130 MB (compared to 1.1 GB Debian standard images).
- **🔒 Hardened Container Security**: Runs under an unprivileged `node` user (UID 1000) with no root escalation.
- **🛡️ Signal & Process Hygiene**: Uses `tini` as init runner for reliable `SIGTERM`/`SIGINT` handling and zombie reaper capability in container runtimes.
- **📦 Multi-Stage Build**: Separates dependencies, compilation, and production runtime layers for optimal Docker layer caching.
- **🩺 Native Healthcheck**: Built-in `/api/health` probe compatible with Docker daemon, Kubernetes liveness/readiness probes, and AWS ECS/Cloud Run.
- **📊 Observability & Metrics**: Live telemetry endpoint `/api/metrics` reporting memory allocations (RSS, heap), uptime, total requests, and category statistics.
- **📖 OpenAPI 3.0 Ready**: Standard `/api/docs/openapi.json` contract for instant Swagger UI or Postman ingestion.
- **💻 Built-in Dev Studio UI**: Includes a web-based testing studio, live API playground, and interactive notes workspace.

---

## 🚀 Quickstart with Docker

### 1. Run using Docker CLI

Pull or build the container image and run immediately:

```bash
# Clone the repository
git clone https://github.com/your-username/dockerized-notes-api.git
cd dockerized-notes-api

# Build the Alpine-based Docker image
docker build -t notes-api:latest .

# Run container on port 3000 with persistent data volume
docker run -d \
  --name notes-api \
  -p 3000:3000 \
  -v notes_data:/data \
  --restart unless-stopped \
  notes-api:latest
```

Verify the container is healthy:

```bash
curl http://localhost:3000/api/health
```

### 2. Run using Docker Compose (Recommended)

Start the microservice with isolated networking and volume storage:

```bash
# Start microservice in detached mode
docker compose up -d

# View real-time container logs
docker compose logs -f

# Check health status
docker compose ps

# Stop container gracefully
docker compose down
```

---

## 🛠️ Local Development (Without Docker)

You can run the application directly with Node.js and TypeScript:

```bash
# 1. Install dependencies
npm install

# 2. Launch full-stack development server with hot-reload
npm run dev

# 3. Build production bundle
npm run build

# 4. Start production server
npm start
```

Default development address: `http://localhost:3000`

---

## 📡 REST API Reference

All requests and responses use standard `application/json` format.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Container healthcheck, uptime, and memory metrics |
| `GET` | `/api/metrics` | Microservice throughput and storage telemetry |
| `GET` | `/api/notes` | List notes with optional filter, search, & sort |
| `GET` | `/api/notes/:id` | Fetch specific note by unique identifier |
| `POST` | `/api/notes` | Create a new note |
| `PUT` | `/api/notes/:id` | Update note content, title, tags, or category |
| `PATCH` | `/api/notes/:id/pin` | Toggle note pinned status |
| `DELETE` | `/api/notes/:id` | Permanently remove a note |
| `POST` | `/api/notes/reset` | Restore initial sample demo dataset |
| `GET` | `/api/docs/openapi.json`| OpenAPI 3.0.3 specification JSON |

---

### Request & Response Examples

#### 1. Check Container Health (`GET /api/health`)

```bash
curl -X GET http://localhost:3000/api/health
```

**Response (`200 OK`):**
```json
{
  "status": "healthy",
  "service": "dockerized-notes-api",
  "version": "1.0.0",
  "timestamp": "2026-10-19T08:30:00.000Z",
  "uptimeSeconds": 312.4,
  "container": {
    "platform": "linux/alpine",
    "nodeVersion": "v20.18.0",
    "pid": 1,
    "memoryUsage": {
      "rssMb": 41.2,
      "heapUsedMb": 22.8,
      "heapTotalMb": 30.1
    }
  }
}
```

#### 2. Create Note (`POST /api/notes`)

```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Configure Production Kubernetes Deployment",
    "content": "Deploy the Dockerized Notes API to the staging cluster using Helm chart with 3 replicas.",
    "category": "DevOps",
    "tags": ["docker", "k8s", "alpine"],
    "pinned": true
  }'
```

**Response (`201 Created`):**
```json
{
  "id": "note_1742080000000_abc1",
  "title": "Configure Production Kubernetes Deployment",
  "content": "Deploy the Dockerized Notes API to the staging cluster using Helm chart with 3 replicas.",
  "category": "DevOps",
  "tags": ["docker", "k8s", "alpine"],
  "pinned": true,
  "createdAt": "2026-10-19T08:32:00.000Z",
  "updatedAt": "2026-10-19T08:32:00.000Z"
}
```

#### 3. List Notes (`GET /api/notes`)

Query parameters supported:
- `search`: Filter matching keywords in title or content
- `category`: Filter by exact category (e.g. `DevOps`, `Architecture`, `General`)
- `tag`: Filter notes that contain specific tag
- `pinned`: `true` or `false`
- `sort`: `updatedAt` (default), `createdAt`, or `title`
- `order`: `desc` (default) or `asc`

```bash
# Search notes with DevOps category
curl -X GET "http://localhost:3000/api/notes?category=DevOps&pinned=true"
```

#### 4. Update Note (`PUT /api/notes/:id`)

```bash
curl -X PUT http://localhost:3000/api/notes/note_1742080000000_abc1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Production Deployment Complete",
    "content": "Successfully deployed to staging namespace. All health checks passing.",
    "tags": ["docker", "k8s", "verified"]
  }'
```

#### 5. Delete Note (`DELETE /api/notes/:id`)

```bash
curl -X DELETE http://localhost:3000/api/notes/note_1742080000000_abc1
```

---

## ⚙️ Environment Variables

Configure container behavior via `.env` or Docker flags:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port on which the Express server listens |
| `HOST` | `0.0.0.0` | Network binding interface |
| `NODE_ENV` | `production` | Node runtime environment (`development` / `production`) |
| `NOTES_STORAGE_PATH` | `/data/notes.json` | Persistent JSON storage file path |
| `CORS_ORIGIN` | `*` | Allowed CORS origins for browser clients |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |

---

## 🏗️ Architecture & Docker Multi-Stage Pipeline

```
┌────────────────────────────────────────────────────────┐
│ Stage 1: dependencies (node:20-alpine)                │
│ -> apk add libc6-compat                                │
│ -> npm ci --omit=dev (production node_modules only)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Stage 2: builder (node:20-alpine)                     │
│ -> npm ci (full devDependencies)                       │
│ -> npm run build (generates client bundles)            │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Stage 3: runner (node:20-alpine)                      │
│ -> apk add tini curl (signal management & healthcheck) │
│ -> USER node (non-root unprivileged process)           │
│ -> EXPOSE 3000 + HEALTHCHECK                           │
│ -> ENTRYPOINT ["/sbin/tini", "--"]                     │
│ -> CMD ["node", "server.js"]                           │
└────────────────────────────────────────────────────────┘
```

### Why Alpine Linux?

- **Miniscule Attack Surface**: Stripped of unnecessary utilities, package managers, and binaries.
- **Ultra-Fast Pull & Deploy**: ~130 MB complete compressed image vs standard 1.1 GB `node:20` images.
- **Security Compliance**: Zero known critical CVEs in minimal base layer with unprivileged non-root execution.

---

## 🧪 Testing

Run automated tests against the running API:

```bash
# Run unit & API integration tests
npm test
```

Or trigger the built-in automated test suite runner directly from the web console.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
