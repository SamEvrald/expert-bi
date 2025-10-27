// Minimal ApiService that automatically reads token from localStorage and attaches Authorization header
export type ApiResponse<T = unknown> = {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
  errors?: unknown;
  timestamp?: string;
};

function getMessageFromUnknown(v: unknown): string | undefined {
  if (!v) return undefined;
  if (typeof v === 'string') return v;
  if (v instanceof Error) return v.message;
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.msg === 'string') return o.msg;
  }
  return undefined;
}

// Minimal ApiService that automatically reads token from localStorage and attaches Authorization header
export class ApiService {
  static baseUrl = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:5000/api';
  static _token: string | null = null;

  static setAuthToken(token: string | null) {
    this._token = token;
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
    }
  }

  private static buildHeaders(custom?: Record<string, string>) {
    const headers: Record<string, string> = { ...(custom || {}) };
    const token =
      this._token ??
      (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('access_token')) : null);
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  static async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    opts: { headers?: Record<string, string>; credentials?: RequestCredentials } = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.buildHeaders(opts.headers);

    let payload: BodyInit | undefined = undefined;
    if (body instanceof FormData) {
      payload = body;
      // do not set Content-Type; browser sets it for FormData
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const res = await fetch(url, {
      method,
      headers,
      body: payload,
      credentials: opts.credentials ?? 'include'
    });

    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!res.ok) {
      const errMsg = getMessageFromUnknown(parsed) || res.statusText || 'API request failed';
      const err = new Error(errMsg) as Error & { status?: number; body?: unknown };
      err.status = res.status;
      err.body = parsed;
      throw err;
    }

    // Cast parsed to ApiResponse<T> — backend uses this shape
    return (parsed as ApiResponse<T>);
  }

  static get<T = unknown>(path: string, opts?: { headers?: Record<string, string>; credentials?: RequestCredentials }) {
    return this.request<T>('GET', path, undefined, opts);
  }
  static post<T = unknown>(path: string, body?: unknown, opts?: { headers?: Record<string, string>; credentials?: RequestCredentials }) {
    return this.request<T>('POST', path, body, opts);
  }
  static put<T = unknown>(path: string, body?: unknown, opts?: { headers?: Record<string, string>; credentials?: RequestCredentials }) {
    return this.request<T>('PUT', path, body, opts);
  }
  static del<T = unknown>(path: string, opts?: { headers?: Record<string, string>; credentials?: RequestCredentials }) {
    return this.request<T>('DELETE', path, undefined, opts);
  }

  // convenience helpers with proper typing
  static getProjects() { 
    return this.get<{ name: string; description?: string; id: number; status: string }[]>('/projects'); 
  }
  
  static getDatasets() { 
    return this.get<Array<{
      id: number;
      name: string;
      description?: string;
      originalFilename: string;
      sizeBytes: number;
      rowCount: number;
      status: 'uploaded' | 'processing' | 'completed' | 'failed';
      createdAt: string;
      updatedAt: string;
    }>>('/datasets'); 
  }
  
  static getDataset(id: string | number) { 
    return this.get<{
      id: number;
      name: string;
      description?: string;
      originalFilename: string;
      sizeBytes: number;
      rowCount: number;
      status: 'uploaded' | 'processing' | 'completed' | 'failed';
      metadata?: {
        headers?: string[];
        preview?: Array<Record<string, unknown>>;
        analysis?: unknown;
      };
      createdAt: string;
      updatedAt: string;
    }>(`/datasets/${id}`); 
  }
  
  static getDatasetAnalysis(datasetId: string | number) { 
    return this.get<{
      summary: {
        totalRows: number;
        totalColumns: number;
        fileSize: number;
        status: string;
        dataQuality?: string;
      };
      columns: Array<{
        name: string;
        type: string;
        nullCount?: number;
        uniqueCount?: number;
        sampleValues?: (string | number)[];
        completeness?: number;
      }>;
      insights: Array<{
        type: 'info' | 'success' | 'warning' | 'error';
        title: string;
        description: string;
      }>;
      chartData: {
        rowDistribution: Array<{ name: string; value: number }>;
        columnTypes?: Array<{ name: string; value: number }>;
        dataQuality?: Array<{ name: string; completeness: number; missing: number }>;
      };
      preview: Array<Record<string, string | number | boolean | null>>;
      dataQuality?: {
        score: string;
        completeness: number;
        uniqueness: number;
        missingValues: number;
        duplicates: number;
        totalCells: number;
      };
      statistics?: {
        numerical: Record<string, {
          mean: number;
          median: number;
          std: number;
          min: number;
          max: number;
          count: number;
        }>;
        categorical: Record<string, Record<string, number>>;
      };
    }>(`/datasets/${datasetId}/analysis`); 
  }
  
  static uploadDataset(formData: FormData) { 
    return this.post<{ id: number }>('/datasets/upload', formData); 
  }
  
  static createProject(payload: { name: string; description?: string }) { 
    return this.post<{ id: number; name: string; description?: string }>('/projects', payload); 
  }
}