// Try to use 127.0.0.1 if available, fallback to localhost
// Some systems have issues with localhost resolving to IPv6 first
const getApiBase = () => {
  const envBase = import.meta.env.VITE_API_BASE;
  if (envBase) return envBase;
  
  // Try 127.0.0.1 first (IPv4) as it's more reliable than localhost (which may try IPv6)
  return 'http://127.0.0.1:4000/api/v1';
};

const API_BASE = getApiBase();

// Log API base URL on module load for debugging
if (typeof window !== 'undefined') {
  console.log('[API] Using API base:', API_BASE);
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let error: ApiError;
    try {
      const errorData = await response.json();
      error = errorData;
    } catch {
      // If response is not JSON, create a structured error
      error = {
        error: {
          code: `HTTP_${response.status}`,
          message: response.statusText || 'An error occurred',
        },
      };
    }
    
    // Log error for debugging
    console.error(`API Error [${response.status}]:`, error);
    
    throw error;
  }
  
  try {
    return await response.json();
  } catch (e) {
    console.error('Failed to parse response JSON:', e);
    throw {
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse server response',
      },
    };
  }
}

export class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    console.log(`[API] ${options?.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
        credentials: 'include',
      });

      return handleResponse<T>(response);
    } catch (error: any) {
      // Handle network errors (fetch failed, CORS, etc.)
      console.error('[API] Request failed:', {
        url,
        error: error.message,
        name: error.name,
        stack: error.stack,
      });
      
      if (error.name === 'TypeError' || error.message?.includes('fetch')) {
        throw {
          error: {
            code: 'NETWORK_ERROR',
            message: `Failed to connect to server at ${API_BASE}. Please check if the API server is running on port 4000.`,
          },
        };
      }
      throw error;
    }
  }

  // Auth
  async signup(data: { email: string; password: string; name: string }) {
    return this.request<{ user: any; accessToken: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ user: any; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refresh() {
    return this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
    });
  }

  async logout() {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  // Tags
  async getTags() {
    return this.request<{ tags: any[] }>('/tags');
  }

  async createTag(data: { name: string; color: string }) {
    return this.request<{ tag: any }>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTag(id: string, data: { name?: string; color?: string }) {
    return this.request<{ tag: any }>(`/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: string) {
    return this.request<{ message: string }>(`/tags/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTasks(params?: {
    status?: string;
    from?: string;
    to?: string;
    q?: string;
    tags?: string;
    priority?: number;
    limit?: number;
    cursor?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<{ tasks: any[]; nextCursor: string | null }>(
      `/tasks${queryString ? `?${queryString}` : ''}`
    );
  }

  async getTask(id: string) {
    return this.request<{ task: any }>(`/tasks/${id}`);
  }

  async createTask(data: any) {
    return this.request<{ task: any }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any) {
    return this.request<{ task: any }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string) {
    return this.request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Calendar
  async getCalendarEvents(from: string, to: string) {
    return this.request<{ events: any[] }>(
      `/calendar/events?from=${from}&to=${to}`
    );
  }

  // Analytics
  async getAnalytics(from?: string, to?: string) {
    const query = new URLSearchParams();
    if (from) query.append('from', from);
    if (to) query.append('to', to);
    const queryString = query.toString();
    return this.request<any>(`/analytics/summary${queryString ? `?${queryString}` : ''}`);
  }

  async getAnalyticsCSV(from?: string, to?: string) {
    const query = new URLSearchParams();
    if (from) query.append('from', from);
    if (to) query.append('to', to);
    const response = await fetch(`${API_BASE}/analytics/csv?${query.toString()}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Reminders
  async getReminders() {
    return this.request<{ reminders: any[] }>('/reminders');
  }

  async dismissReminder(taskId: string) {
    return this.request<{ message: string }>(`/reminders/${taskId}/dismiss`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();

