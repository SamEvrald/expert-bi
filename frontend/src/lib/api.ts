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

  // convenience helpers (now generic)
  static getProjects<T = unknown>() { return this.get<T>('/projects'); }
  static getDatasets<T = unknown>() { return this.get<T>('/datasets'); }
  static getDataset<T = unknown>(id: string | number) { return this.get<T>(`/datasets/${id}`); }
  static getDatasetAnalysis<T = unknown>(datasetId: string | number) { return this.get<T>(`/datasets/${datasetId}/analysis`); }
  static uploadDataset<T = unknown>(formData: FormData) { return this.post<T>('/datasets/upload', formData); }
  static createProject<T = unknown>(payload: { name: string; description?: string }) { return this.post<T>('/projects', payload); }
}