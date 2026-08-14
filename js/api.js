/*
 * AlumniX Production API Client Service
 * Wrapper around native fetch API adding Bearer token authentication headers.
 */

class ApiClient {
  getApiBase() {
    if (window.ALUMNIX_CONFIG && window.ALUMNIX_CONFIG.API_BASE_URL) {
      const base = window.ALUMNIX_CONFIG.API_BASE_URL;
      // Remove /api suffix if present, we add it in endpoint construction
      return base.endsWith('/api') ? base.substring(0, base.length - 4) : base;
    }
    return '';
  }

  getFullUrl(endpoint) {
    const base = this.getApiBase();
    // Always ensure endpoint starts with /api/
    const normalizedEndpoint = endpoint.startsWith('/api/') ? endpoint : endpoint.startsWith('/') ? `/api${endpoint}` : `/api/${endpoint}`;
    return base ? `${base}${normalizedEndpoint}` : normalizedEndpoint;
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
    const fullUrl = this.getFullUrl(endpoint);
    const url = new URL(fullUrl, window.location.origin);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const headers = await this.getAuthHeaders();
    console.log(`[ApiClient] GET ${url.toString()}`);
    const response = await fetch(url.toString(), { method: 'GET', headers });
    return this.handleResponse(response);
  }

  async post(endpoint, data = {}) {
    const fullUrl = this.getFullUrl(endpoint);
    const headers = await this.getAuthHeaders();
    console.log(`[ApiClient] POST ${fullUrl}`, data);
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async patch(endpoint, data = {}) {
    const fullUrl = this.getFullUrl(endpoint);
    const headers = await this.getAuthHeaders();
    console.log(`[ApiClient] PATCH ${fullUrl}`, data);
    const response = await fetch(fullUrl, {
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
