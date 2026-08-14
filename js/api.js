/*
 * AlumniX Production API Client Service
 * Wrapper around native fetch API adding Bearer token authentication headers.
 */

class ApiClient {
  getApiBase() {
    if (window.ALUMNIX_CONFIG && window.ALUMNIX_CONFIG.API_BASE_URL) {
      return window.ALUMNIX_CONFIG.API_BASE_URL;
    }
    return window.location.origin.includes('5000') ? 'http://127.0.0.1:5000/api' : '/api';
  }

  async getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Retrieve access token from global Supabase client instance
    if (window.supabaseClient) {
      try {
        const { data } = await window.supabaseClient.auth.getSession();
        if (data && data.session && data.session.access_token) {
          headers['Authorization'] = `Bearer ${data.session.access_token}`;
        }
      } catch (e) {
        console.warn("[ApiClient] Error fetching auth session token:", e);
      }
    }
    
    return headers;
  }

  async get(endpoint, params = {}) {
    const apiBase = this.getApiBase();
    const urlStr = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const url = new URL(urlStr, window.location.origin);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const headers = await this.getAuthHeaders();
    const response = await fetch(url.toString(), { method: 'GET', headers });
    return this.handleResponse(response);
  }

  async post(endpoint, data = {}) {
    const apiBase = this.getApiBase();
    const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async patch(endpoint, data = {}) {
    const apiBase = this.getApiBase();
    const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let jsonResult = {};
    if (contentType && contentType.includes('application/json')) {
      jsonResult = await response.json();
    } else {
      const text = await response.text();
      jsonResult = { message: text };
    }

    if (response.status === 401) {
      console.warn("[ApiClient] Session unauthorized (401). Redirecting to login...");
      if (!window.location.pathname.includes("login.html") && !window.location.pathname.includes("index.html")) {
        window.location.href = "login.html";
      }
    }

    if (!response.ok) {
      const errorMsg = jsonResult.error || jsonResult.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return jsonResult;
  }
}

window.apiClient = new ApiClient();
