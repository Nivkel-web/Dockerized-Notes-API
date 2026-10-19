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

export interface CreateNoteDto {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  pinned?: boolean;
  color?: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  pinned?: boolean;
  color?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  container: {
    platform: string;
    nodeVersion: string;
    pid: number;
    memoryUsage: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
      externalMb: number;
    };
  };
}

export interface MetricsResponse {
  service: string;
  uptimeSeconds: number;
  totalRequests: number;
  requestsByMethod: Record<string, number>;
  averageResponseTimeMs: number;
  notesStats: {
    total: number;
    pinned: number;
    categoriesCount: Record<string, number>;
    tagsCount: Record<string, number>;
  };
}

export interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  expectedStatus: number;
  latencyMs: number;
  passed: boolean;
  details: string;
}
