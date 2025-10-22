import { authManager } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.error || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text() as T;
}

export async function api<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...authManager.getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, `Erreur réseau: ${error instanceof Error ? error.message : 'Inconnue'}`);
  }
}

// Helper functions pour les endpoints spécifiques
export const apiGet = <T>(endpoint: string) => api<T>(endpoint);

export const apiPost = <T>(endpoint: string, data?: any) =>
  api<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = <T>(endpoint: string, data?: any) =>
  api<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = (endpoint: string) =>
  api(endpoint, { method: 'DELETE' });

// Types pour l'API
export interface App {
  id: number;
  name: string;
  protocol: string;
  host: string;
  port: number;
  path: string;
  tag?: string;
  icon?: string;
  health_path: string;
  health_type: string;
  created_at: string;
}

export interface Alert {
  id: number;
  source: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  payload?: string;
  created_at: string;
  acknowledged: boolean;
}

export interface HealthStatus {
  app_id?: number;
  status: 'online' | 'offline' | 'unknown';
  latency?: number;
  last_check: string;
  status_code?: number;
  error?: string;
}

export interface CreateAppRequest {
  name: string;
  protocol: string;
  host: string;
  port: number;
  path: string;
  tag?: string;
  icon?: string;
  health_path: string;
  health_type: string;
}

export interface NotifyTestRequest {
  to: string;
}

export interface SubscribeRequest {
  channel: 'email' | 'webhook';
  endpoint: string;
}
