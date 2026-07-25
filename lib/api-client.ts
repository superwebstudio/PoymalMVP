/**
 * Centralized API client using the secure HttpOnly session cookie.
 */

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const headers = new Headers(options.headers);
  
  // Add JSON content type if body is present and not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  try {
    const requestOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers,
    };
    let response = await fetch(endpoint, requestOptions);

    if (response.status === 401 && !endpoint.startsWith('/api/auth/')) {
      const refreshResponse = await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        response = await fetch(endpoint, requestOptions);
      }
    }
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      return {
        data: null,
        error: `Rate limited. Try again in ${retryAfter || '60'} seconds.`,
        status: 429,
      };
    }
    
    // Try to parse JSON response
    let data: T | null = null;
    const contentType = response.headers.get('Content-Type');
    
    if (contentType?.includes('application/json')) {
      const json = await response.json();
      
      if (!response.ok) {
        return {
          data: null,
          error: json.error || json.message || 'Request failed',
          status: response.status,
        };
      }
      
      data = json as T;
    } else if (!response.ok) {
      const text = await response.text();
      return {
        data: null,
        error: text || 'Request failed',
        status: response.status,
      };
    }
    
    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    console.error('API request error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
    
  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
    
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
    
  delete: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Upload a file with authentication
 */
export async function uploadFile(
  file: File,
  endpoint: string = '/api/upload'
): Promise<{ url: string | null; error: string | null }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const result = await api.post<{ url: string }>(endpoint, formData);
  
  if (result.error) {
    return { url: null, error: result.error };
  }
  
  return { url: result.data?.url || null, error: null };
}

